#!/usr/bin/env node
// Contrôles rapides, sans navigateur : données, tables de tirage, équité, retour théorique.
//   node scripts/smoke.mjs

import './shim-storage.mjs';
import crypto from 'node:crypto';
import { adminConfigured, isAdmin, loginAdmin, logoutAdmin, setupAdmin } from '../js/admin.js';
import { RULES } from '../js/config.js';
import { CARDS, dropTable, expectedValue, packAvailable, packReturn, packTable, resolveTicket, stockCards } from '../js/catalog.js';
import { BADGES, progress } from '../js/data/badges.js';
import { giveawayPool, listGiveaways } from '../js/data/giveaways.js';
import { DEFAULTS, blendedEdge, expectedMonth, levers, packEconomics, simulateMonths } from '../js/economics.js';
import { isTranslated } from '../js/data/names-fr.js';
import { PACKS, RARITIES } from '../js/data/packs.js';
import { THEMES } from '../js/data/themes.js';
import { drawFromPack } from '../js/draw.js';
import { TICKETS, hmacHex, sha256Hex, ticketFor } from '../js/fair.js';
import { adjustStock, clearStock, drawableQty, exportStock, importStock, qtyOf, reservedOf, resetStock, setStock, usingDemoStock } from '../js/stock.js';
import * as store from '../js/store.js';
import fs from 'node:fs';

let failures = 0;
const check = (ok, message) => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok ' : 'ÉCHEC'}  ${message}`);
};

console.log('Catalogue');
check(CARDS.length >= 300, `${CARDS.length} cartes`);
check(new Set(CARDS.map((c) => c.id)).size === CARDS.length, 'identifiants uniques');
check(CARDS.every((c) => Number.isInteger(c.value) && c.value > 0), 'cotes entières en centimes');
check(CARDS.every((c) => /^https:\/\/images\.pokemontcg\.io\/[a-z0-9]+\/[A-Za-z0-9]+\.png$/.test(c.img)), "adresses d'images valides");
const untranslated = [...new Set(CARDS.filter((c) => !isTranslated(c.nameEn)).map((c) => c.nameEn))];
check(untranslated.length === 0, `noms français (${untranslated.length} manquant${untranslated.length > 1 ? 's' : ''}${untranslated.length ? ` : ${untranslated.slice(0, 5).join(', ')}` : ''})`);

console.log('\nÉquité (comparaison avec les fonctions de hachage de Node)');
const samples = ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'é€😀'.repeat(40), 'x'.repeat(1000)];
check(samples.every((s) => sha256Hex(s) === crypto.createHash('sha256').update(s).digest('hex')), 'SHA-256 conforme');
const pairs = [['clé', 'message'], ['k'.repeat(100), 'm'.repeat(300)], ['', ''], ['graine', 'client:12:pack:starter']];
check(pairs.every(([k, m]) => hmacHex(k, m) === crypto.createHmac('sha256', k).update(m).digest('hex')), 'HMAC-SHA256 conforme');
{
  const n = 200_000;
  const deciles = new Array(10).fill(0);
  let inRange = true;
  for (let i = 0; i < n; i++) {
    const t = ticketFor('graine-serveur-de-test', 'client', i, 'pack:starter');
    if (!Number.isInteger(t) || t < 0 || t >= TICKETS) inRange = false;
    deciles[Math.floor(t / (TICKETS / 10))]++;
  }
  check(inRange, 'tickets entiers dans [0, 1 000 000)');
  check(deciles.every((d) => Math.abs(d / n - 0.1) < 0.004), `tickets uniformes (déciles ${deciles.map((d) => ((d / n) * 100).toFixed(1)).join(' ')})`);
  check(ticketFor('s', 'c', 1, 'pack:a') !== ticketFor('s', 'c', 2, 'pack:a') && ticketFor('s', 'c', 1, 'pack:a') === ticketFor('s', 'c', 1, 'pack:a'), 'ticket déterministe et sensible au compteur');
}

console.log('\nPacks (tables calculées sur le coffre)');
for (const pack of PACKS) {
  check(pack.tiers.every((t) => RARITIES[t.rarity]) && pack.tiers.every((t, i) => i === 0 || t.min > pack.tiers[i - 1].max), `${pack.slug} : paliers croissants, disjoints, raretés connues`);
  const t = packTable(pack);
  if (!t.ok) {
    check(false, `${pack.slug} : en rupture avec le stock de départ (${t.message})`);
    continue;
  }
  const table = t.drops;
  const contiguous = table.every((d, i) => d.from === (i ? table[i - 1].to : 0) && d.to > d.from);
  check(contiguous && table[table.length - 1].to === TICKETS, `${pack.slug} : table de ${table.length} cartes, ${TICKETS} tickets sans trou ni recouvrement`);
  const tierOk = t.tiers.every((tier, i) => table.filter((d) => d.tierIndex === i).reduce((sum, d) => sum + (d.to - d.from), 0) === Math.round(tier.p * TICKETS));
  check(tierOk && Math.abs(t.tiers.reduce((sum, tier) => sum + tier.p, 0) - 1) < 1e-9, `${pack.slug} : paliers ${t.tiers.map((tier) => `${tier.count}·${(tier.p * 100).toFixed(1)} %`).join(' / ')}`);
  check(table.every((d) => d.copies >= 1 && drawableQty(d.card.id) >= 1), `${pack.slug} : chaque carte de la table est au coffre`);
  check([0, 1, 499_999, TICKETS - 1].every((n) => { const d = resolveTicket(pack, n); return n >= d.from && n < d.to; }), `${pack.slug} : résolution des tickets`);
  const ret = packReturn(pack);
  check(Math.abs(ret - pack.target) <= RULES.returnTolerance, `${pack.slug} : retour théorique ${(ret * 100).toFixed(1)} % (cible ${Math.round(pack.target * 100)} % ± 1), cote moyenne ${(expectedValue(pack) / 100).toFixed(2)} € pour ${(pack.price / 100).toFixed(2)} €`);
}

console.log('\nCoffre');
{
  const copies = () => stockCards().reduce((sum, c) => sum + qtyOf(c.id), 0);
  const start = copies();
  check(usingDemoStock() && stockCards().length === CARDS.length, `stock de départ : ${stockCards().length} références, ${start} exemplaires`);

  clearStock();
  check(stockCards().length === 0 && PACKS.every((p) => !packAvailable(p)), 'coffre vide : tous les packs passent en rupture, sans erreur');

  // Un coffre trop maigre : quelques cartes seulement, le pack ne se compose pas.
  CARDS.filter((c) => c.value >= 4_00 && c.value <= 6_99).slice(0, 5).forEach((c) => setStock(c.id, 2));
  const thin = packTable(PACKS[0]);
  check(!thin.ok && thin.reason === 'stock' && thin.message.length > 10, `coffre trop maigre : le Starter reste fermé (« ${thin.message.slice(0, 60)}… »)`);

  resetStock();
  check(copies() === start && PACKS.every(packAvailable), 'retour au stock de départ : tous les packs rouvrent');

  // Une carte gagnée quitte le coffre ; à zéro exemplaire, elle sort de toutes les tables.
  const rare = stockCards().find((c) => qtyOf(c.id) === 1 && PACKS.some((p) => dropTable(p).some((d) => d.card.id === c.id)));
  adjustStock(rare.id, -1);
  check(qtyOf(rare.id) === 0 && PACKS.every((p) => !dropTable(p).some((d) => d.card.id === rare.id)) && !adjustStock(rare.id, -1), 'dernier exemplaire sorti : la carte quitte toutes les tables, et ne peut pas passer sous zéro');
  adjustStock(rare.id, 1);

  // Les lots d'un giveaway en cours sont mis de côté.
  const lots = listGiveaways().filter((g) => g.fundRate).flatMap((g) => g.lots);
  check(lots.length > 0 && lots.every((c) => reservedOf(c.id) === 1 && drawableQty(c.id) === qtyOf(c.id) - 1), `giveaway : ${lots.length} lots mis de côté, hors des packs`);
  check(lots.filter((c) => qtyOf(c.id) === 1).every((c) => PACKS.every((p) => !dropTable(p).some((d) => d.card.id === c.id))), 'giveaway : un lot en un seul exemplaire ne peut sortir d\'aucun pack');

  // Export puis import : même coffre.
  const file = JSON.parse(JSON.stringify(exportStock()));
  clearStock();
  const refs = importStock(file);
  check(refs === CARDS.length && copies() === start && !usingDemoStock() && PACKS.every(packAvailable), `export puis import : ${refs} références retrouvées`);
  let refused = false;
  try { importStock({ items: {} }); } catch { refused = true; }
  check(refused, 'import : un fichier qui ne vient pas du site est refusé');
  resetStock();
}

console.log('\nAccès admin');
{
  check(!adminConfigured() && !isAdmin(), 'aucun accès au départ');
  check(!setupAdmin('ad', 'motdepasse').ok && !setupAdmin('admin', 'court').ok, 'identifiant et mot de passe trop courts refusés');
  check(setupAdmin('Gerant', 'un-vrai-mot-de-passe').ok && isAdmin(), 'création de l\'accès : session ouverte');
  logoutAdmin();
  check(!isAdmin() && !loginAdmin('gerant', 'mauvais').ok && !isAdmin(), 'mauvais mot de passe refusé');
  check(loginAdmin('gerant', 'un-vrai-mot-de-passe').ok && isAdmin(), 'connexion (identifiant insensible à la casse)');
  check(!localStorage.getItem('pokiiiii.admin.v1').includes('un-vrai-mot-de-passe'), 'le mot de passe n\'est pas conservé en clair');
  logoutAdmin();
}

console.log('\nTirage libre (200 000 tirages par pack)');
for (const pack of PACKS) {
  const n = 200_000;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += drawFromPack(pack).card.value;
  const ev = expectedValue(pack);
  check(Math.abs(sum / n - ev) / ev < 0.03, `${pack.slug} : cote moyenne simulée ${(sum / n / 100).toFixed(2)} € (théorique ${(ev / 100).toFixed(2)} €)`);
}

console.log('\nRachat, Évolution, fidélité');
check(RULES.buybackLaterRate < RULES.buybackRate && RULES.buybackLaterRate > 0.5, `rachat : ${RULES.buybackRate * 100} % pendant la garantie, ${RULES.buybackLaterRate * 100} % ensuite`);
{
  const { minRatio, maxChance, edgeMin, edgeMax, edgeSlope } = RULES.evolution;
  const edge = (m) => Math.min(edgeMax, edgeMin + edgeSlope * Math.max(0, m - minRatio));
  const chance = (m) => Math.min(maxChance, (1 - edge(m)) / m);
  const ms = [1.25, 1.5, 2, 3, 5, 10, 25, 100];
  check(ms.every((m, i) => i === 0 || (edge(m) >= edge(ms[i - 1]) && chance(m) < chance(ms[i - 1]))), 'évolution : la marge monte et la chance baisse avec le multiplicateur');
  check(ms.every((m) => chance(m) * m < 1 && chance(m) > 0), `évolution : retour toujours inférieur à 100 % (de ${((1 - edgeMin) * 100).toFixed(0)} % à ${((1 - edgeMax) * 100).toFixed(0)} %)`);
}
{
  const wheel = RULES.cashback.wheel;
  const tickets = wheel.reduce((s, [, t]) => s + t, 0);
  const mean = wheel.reduce((s, [m, t]) => s + (m * t) / TICKETS, 0);
  check(tickets === TICKETS, 'roue du cashback : le barème couvre tous les tickets');
  check(Math.abs(mean - 1) < 1e-9, `roue du cashback : moyenne ×${mean.toFixed(4)} (aucun coût en plus pour le site)`);
}
check(BADGES.every((b, i) => i === 0 || (b.xp > BADGES[i - 1].xp && b.cashback > BADGES[i - 1].cashback)) && progress(0).current === BADGES[0] && progress(1e9).next === null, 'badges : seuils et parts de cashback croissants');
check(BADGES.every((b) => b.cashback > 0 && b.cashback <= 0.2), `cashback : de ${BADGES[0].cashback * 100} % à ${BADGES[BADGES.length - 1].cashback * 100} % de la marge, jamais plus`);
check(BADGES.every((b) => THEMES.some((t) => t.id === b.theme)), 'badges : chacun rattaché à un thème');
check(RULES.leaderboardSplit.reduce((a, b) => a + b, 0) === 1, 'classement : le partage de la dotation fait 100 %');
{
  // Aucun détour ne doit rapporter plus que la revente directe d'une carte.
  const detour = (1 - RULES.evolution.edgeMin) * RULES.buybackRate;
  check(detour <= RULES.buybackLaterRate, `pas d'arbitrage : passer par l'Évolution puis revendre rend ${(detour * 100).toFixed(1)} % au mieux, contre ${RULES.buybackLaterRate * 100} % en revente directe`);
  const edges = PACKS.map((p) => 1 - packReturn(p));
  const cost = (edge) => 1 - RULES.bonus.wagering * edge;
  check(cost(blendedEdge()) <= 0.05 && cost(Math.min(...edges)) <= 0.25, `bonus : le jouer coûte en moyenne ${Math.round(RULES.bonus.wagering * blendedEdge() * 100)} % de son montant (au moins ${Math.round(RULES.bonus.wagering * Math.min(...edges) * 100)} % sur le pack le plus généreux)`);
  check(store.shippingFee('fr', 1, 40_00) === RULES.shipping.fr.base && store.shippingFee('fr', 2, 1000_00) === RULES.shipping.fr.base + RULES.shipping.fr.perExtraCard + 9_50, 'livraison : forfait, supplément par carte, assurance au-delà de 50 €');
}

console.log('\nModèle économique (hypothèses par défaut)');
{
  const top = BADGES[BADGES.length - 1].cashback;
  const euros = (c) => `${(c / 100).toFixed(0)} €`;
  const rates = (h) => PACKS.map((p) => packEconomics(p, h).rate);
  const low = (h) => `${(Math.min(...rates(h)) * 100).toFixed(1)} %`;
  const worst = { ...DEFAULTS, cashbackRate: top };
  check(rates(worst).every((r) => r > 0), `chaque pack reste bénéficiaire avec le cashback au plus haut (au pire ${low(worst)} du prix)`);
  const sellAll = { ...DEFAULTS, instant: 1, later: 0, cashbackRate: top };
  check(rates(sellAll).every((r) => r > 0), `chaque pack reste bénéficiaire si toutes les cartes sont revendues aussitôt (au pire ${low(sellAll)})`);
  const stress = { ...sellAll, cost: 1, fees: 0.06 };
  check(rates(stress).every((r) => r > 0), `chaque pack reste bénéficiaire même avec des cartes achetées à la cote et 6 % de frais (au pire ${low(stress)})`);

  const m = expectedMonth(DEFAULTS);
  const lines = m.revenue - m.cards - m.cashback - m.leaderboard - m.giveaway - m.bonus - m.fees - m.vat - m.fixed;
  check(Math.abs(lines - m.result) < 1 && Math.abs(m.gross - (m.revenue - m.cards)) < 1, 'compte de résultat : les lignes retombent sur le résultat');
  check(m.contribution > 0 && m.result > 0, `mois type : ${euros(m.revenue)} de ventes, ${euros(m.gross)} de marge de jeu, ${euros(m.contribution)} avant frais fixes, ${euros(m.result)} après (${(m.rate * 100).toFixed(1)} %)`);
  check(m.breakEven < DEFAULTS.packs && Math.abs(expectedMonth({ ...DEFAULTS, packs: m.breakEven }).result) < m.contribution / DEFAULTS.packs + 1, `seuil de rentabilité : ${m.breakEven} packs par mois`);
  const sim = simulateMonths(DEFAULTS, { runs: 120 });
  check(Math.abs(sim.mean - m.result) / m.contribution < 0.05, `simulation cohérente avec le calcul (${euros(sim.mean)} en moyenne, mauvais mois ${euros(sim.low)})`);
  check(sim.lossRisk < 0.05, `mois type : ${(sim.lossRisk * 100).toFixed(1)} % de mois déficitaires sur ${sim.runs} simulés`);
  const lv = levers(DEFAULTS);
  check(lv.every((l) => l.gain > 0) && lv[0].key === 'cost', `leviers : ${lv.map((l) => `${l.key} +${euros(l.gain)}`).join(', ')}`);
  check(expectedMonth({ ...DEFAULTS, vat: 0 }).result > m.result && expectedMonth({ ...DEFAULTS, cost: 1 }).result < m.result && expectedMonth({ ...DEFAULTS, rtpShift: -0.01 }).result < m.result, 'le modèle réagit dans le bon sens à la TVA, au prix des cartes et au retour des packs');
}

console.log('\nCompte : bonus, argent du joueur, livraison');
{
  resetStock();
  const stockStart = stockCards().reduce((sum, c) => sum + qtyOf(c.id), 0);
  const { wagering, firstDepositRate } = RULES.bonus;
  const st = () => store.getState();
  const sound = () => st().bonus.balance >= 0 && st().bonus.balance <= st().balance && store.withdrawable() === st().balance - st().bonus.balance;

  store.resetDemo();
  store.signup('Testeur');
  check(st().balance === RULES.welcomeCredit && store.withdrawable() === 0 && store.bonusStatus().wagerLeft === RULES.welcomeCredit * wagering, 'crédit de bienvenue : en jeu, non retirable, à miser ' + wagering + ' fois');

  const first = store.deposit(100_00);
  check(first.ok && first.bonus === 100_00 * firstDepositRate && store.withdrawable() === 100_00, 'premier dépôt : bonus à part, argent déposé retirable en entier');
  check(store.deposit(20_00).bonus === 0 && store.withdrawable() === 120_00, 'les dépôts suivants ne donnent pas de bonus');

  const bonusBefore = st().bonus.balance;
  const real = store.buyPacks('master', 2);
  check(real.ok && st().bonus.balance === bonusBefore && real.pulls.every((c) => !c.bonusShare) && store.withdrawable() === 120_00 - 2 * 49_95, "achat : l'argent du joueur part en premier, la carte lui appartient sans condition");

  const mixed = store.buyPacks('pro', 1);
  const card = mixed.pulls[0];
  const share = (24_95 - 20_10) / 24_95;
  check(mixed.ok && Math.abs(card.bonusShare - share) < 1e-9 && st().bonus.balance === bonusBefore - 4_85 && store.withdrawable() === 0 && sound(), 'achat mixte : le bonus complète, la carte garde sa part de bonus');
  check(!store.canShip(card) && store.requestShipment({ uids: [card.uid], zone: 'fr', address: { name: 'A', line1: 'B', zip: '75001', city: 'Paris' } }).code === 'bonus', "une carte payée avec un bonus ne s'expédie pas avant la fin du bonus");

  const ownCard = real.pulls[0];
  const address = { name: 'A', line1: 'B', zip: '75001', city: 'Paris' };
  check(store.canShip(ownCard) && store.requestShipment({ uids: [ownCard.uid], zone: 'fr', address }).code === 'balance', 'frais de livraison : jamais payés avec des fonds de bonus');

  const bonusNow = st().bonus.balance;
  const sale = store.sellCards([card.uid]);
  const back = Math.round(sale.total * share);
  check(sale.ok && st().bonus.balance === bonusNow + back && store.withdrawable() === sale.total - back && sound(), 'revente : la part de bonus retourne aux fonds de bonus, le reste est retirable');

  store.deposit(20_00);
  const fee = store.shippingFee('fr', 1, ownCard.value);
  const cash = store.withdrawable();
  const ship = store.requestShipment({ uids: [ownCard.uid], zone: 'fr', address });
  check(ship.ok && ship.fee === fee && store.withdrawable() === cash - fee && sound(), `livraison d'une carte à ${(ownCard.value / 100).toFixed(2)} € : ${(fee / 100).toFixed(2)} € de frais, payés hors bonus`);
  check(st().points.total === Math.floor(2 * 49.95) + Math.floor(24.95), 'classement : seuls les achats donnent des points');

  // Un bonus se clôt toujours. On joue le crédit de bienvenue sans rien déposer,
  // en revendant chaque carte aussitôt : c'est la façon la moins coûteuse de le jouer.
  const runs = 150;
  let converted = 0;
  let paid = 0;
  let ok = true;
  for (let run = 0; run < runs; run++) {
    store.resetDemo();
    store.signup('Testeur');
    for (let i = 0; i < 600 && store.bonusStatus().active; i++) {
      const qty = Math.min(RULES.maxPacksPerOrder, Math.floor(st().balance / 9_95));
      if (qty < 1) break;
      store.buyPacks('starter', qty);
      store.sellCards(st().cards.filter((c) => c.status === 'coffre').map((c) => c.uid));
      ok = ok && sound();
    }
    ok = ok && !store.bonusStatus().active && st().bonus.balance === 0 && !st().cards.some((c) => c.bonusShare);
    if (st().balance > 0) {
      converted++;
      paid += st().balance;
    }
  }
  check(ok, `bonus sans dépôt, ${runs} comptes : toujours clos, joué (${converted}) ou épuisé (${runs - converted})`);
  store.resetDemo();
  const stockEnd = stockCards().reduce((sum, c) => sum + qtyOf(c.id), 0);
  check(stockEnd === stockStart - 1, `coffre : après tous ces comptes, tout est revenu sauf la carte expédiée (${stockStart} -> ${stockEnd})`);
  resetStock();
  check(paid / runs < RULES.welcomeCredit * 0.5, `bonus sans dépôt : ${(paid / runs / 100).toFixed(2)} € retirables en moyenne par compte pour ${RULES.welcomeCredit / 100} € offerts (à couper en production)`);
  store.resetDemo();
}

console.log('\nGiveaways');
for (const g of listGiveaways()) {
  check(g.lots.length > 0 && g.total > 0 && g.end > g.start && g.drawAt > g.end, `${g.id} : ${g.lots.length} lots, ${(g.total / 100).toFixed(2)} €, dates cohérentes`);
  if (!g.fundRate) continue;
  const steps = [0, 100, 500, 1000, 1500, 2500, 10000].map((t) => giveawayPool(g, t));
  check(steps.every((p, i) => i === 0 || p.unlocked >= steps[i - 1].unlocked) && steps[0].unlocked === 0 && steps[steps.length - 1].unlocked === g.lots.length, `${g.id} : les lots se débloquent au fil des ventes`);
  const funded = steps.every((p) => g.lots.filter((c) => p.need.get(c.id) <= p.tickets).reduce((s, c) => s + c.value, 0) <= p.tickets * p.perTicket + 1);
  check(funded, `${g.id} : la valeur des lots débloqués ne dépasse jamais la cagnotte`);
}

console.log('\nThèmes');
const css = fs.readFileSync(new URL('../css/themes.css', import.meta.url), 'utf8');
const init = fs.readFileSync(new URL('../js/theme-init.js', import.meta.url), 'utf8');
check(THEMES.every((t) => css.includes(`[data-theme='${t.id}']`)), `${THEMES.length} thèmes présents dans css/themes.css`);
check(THEMES.every((t) => init.includes(`'${t.id}'`)), 'identifiants repris dans js/theme-init.js');
check(THEMES.every((t) => CARDS.some((c) => (!t.match.types || t.match.types.includes(c.type)) && (!t.match.names || t.match.names.test(c.nameEn)))), 'chaque thème a une carte pour l’illustrer');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTout est bon.');
process.exit(failures ? 1 : 0);
