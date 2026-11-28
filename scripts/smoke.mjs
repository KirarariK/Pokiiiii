#!/usr/bin/env node
// Contrôles rapides, sans navigateur : données, tables de tirage, équité, retour théorique.
//   node scripts/smoke.mjs

import './shim-storage.mjs';
import crypto from 'node:crypto';
import { adminConfigured, isAdmin, loginAdmin, logoutAdmin, setupAdmin } from '../js/admin.js';
import { RULES } from '../js/config.js';
import { CARDS, dropTable, expectedValue, packAvailable, packEdge, packReturn, packTable, resolveTicket, stockCards } from '../js/catalog.js';
import { BADGES, progress } from '../js/data/badges.js';
import { giveawayPool, listGiveaways } from '../js/data/giveaways.js';
import { DEFAULTS, blendedEdge, expectedMonth, levers, packEconomics, simulateMonths } from '../js/economics.js';
import { isTranslated } from '../js/data/names-fr.js';
import { PACKS, RARITIES } from '../js/data/packs.js';
import { THEMES } from '../js/data/themes.js';
import { drawFromPack } from '../js/draw.js';
import { TICKETS, hmacHex, sha256Hex, ticketFor } from '../js/fair.js';
import { imgUrl } from '../js/format.js';
import { adjustStock, clearStock, drawableQty, exportStock, importStock, qtyOf, reservedOf, resetStock, setPrice, setStock, usingDemoStock } from '../js/stock.js';
import * as store from '../js/store.js';
import fs from 'node:fs';

let failures = 0;
/** Lots de giveaway déjà mis de côté au chargement, avant tout appel de ce script. */
const reservedAtStart = CARDS.filter((c) => reservedOf(c.id) > 0).length;
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

console.log('\nCatalogue complet');
{
  const raw = JSON.parse(fs.readFileSync(new URL('../assets/data/catalogue.json', import.meta.url), 'utf8'));
  const ids = raw.cards.map((r) => r[8] || `${raw.sets[r[0]][0]}-${r[1]}`);
  check(raw.cards.length >= 18_000 && raw.sets.length >= 170, `${raw.cards.length} cartes dans ${raw.sets.length} extensions (cotes du ${raw.date})`);
  check(new Set(ids).size === ids.length, 'identifiants uniques');
  const known = new Set(ids);
  const absent = CARDS.filter((c) => !known.has(c.id));
  check(absent.length === 0, `chaque carte du fonds de démonstration figure au catalogue (${absent.length} absente${absent.length > 1 ? 's' : ''})`);
  const priced = raw.cards.filter((r) => r[6] > 0).length;
  check(priced / raw.cards.length > 0.9, `${Math.round((priced / raw.cards.length) * 100)} % des cartes ont une cote`);
  const pokemon = raw.cards.filter((r) => r[3] === 0);
  const french = pokemon.filter((r) => isTranslated(r[2])).length;
  check(french / pokemon.length > 0.97, `noms français : ${french} cartes Pokémon sur ${pokemon.length}`);
}

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
  check(!localStorage.getItem('coffreo.admin.v1').includes('un-vrai-mot-de-passe'), 'le mot de passe n\'est pas conservé en clair');
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

{
  // TVA : le modèle par défaut retient la lecture la plus favorable ; les deux autres doivent rester chiffrées.
  const byRegime = [1, 2, 3].map((vat) => expectedMonth({ ...DEFAULTS, vat }));
  check(byRegime[0].vat < byRegime[1].vat && byRegime[1].vat < byRegime[2].vat && byRegime[2].result < 0, `TVA selon le régime : ${byRegime.map((m) => Math.round(m.vat / 100) + ' €').join(' / ')} ; résultat ${byRegime.map((m) => Math.round(m.result / 100) + ' €').join(' / ')}`);
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

  const price = (slug) => PACKS.find((p) => p.slug === slug).price;
  const bonusBefore = st().bonus.balance;
  const real = store.buyPacks('orage', 2);
  const left = 120_00 - 2 * price('orage');
  check(real.ok && st().bonus.balance === bonusBefore && real.pulls.every((c) => !c.bonusShare) && store.withdrawable() === left, "achat : l'argent du joueur part en premier, la carte lui appartient sans condition");

  // Achat plus cher que l'argent restant : le bonus paie la différence.
  const mixed = store.buyPacks('zenith', 1);
  const card = mixed.pulls[0];
  const fromBonus = price('zenith') - left;
  const share = fromBonus / price('zenith');
  check(left > 0 && fromBonus > 0 && mixed.ok && Math.abs(card.bonusShare - share) < 1e-9 && st().bonus.balance === bonusBefore - fromBonus && store.withdrawable() === 0 && sound(), 'achat mixte : le bonus complète, la carte garde sa part de bonus');
  check(!store.canShip(card) && store.requestShipment({ uids: [card.uid], zone: 'fr', address: { name: 'A', line1: 'B', zip: '75001', city: 'Paris' } }).code === 'bonus', "une carte payée avec un bonus ne s'expédie pas avant la fin du bonus");

  {
    // Dix packs payés presque entièrement avec de l'argent déposé : le bonus ne retient qu'une carte.
    const before = JSON.stringify(st());
    store.deposit(10 * price('rosee') - 2_00);
    const order = store.buyPacks('rosee', 10);
    const held = order.pulls.filter((c) => c.bonusShare > 0);
    check(order.ok && held.length === 1 && Math.abs(held[0].bonusShare - 2_00 / price('rosee')) < 1e-9, 'bonus : sa part est portée par le moins de cartes possible, pas par toute la commande');
    store.sellCards(order.pulls.map((c) => c.uid));
    Object.assign(st(), JSON.parse(before));
  }
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
  check(st().points.total === Math.floor((2 * price('orage')) / 100) + Math.floor(price('zenith') / 100), 'classement : seuls les achats donnent des points');

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
      const qty = Math.min(RULES.maxPacksPerOrder, Math.floor(st().balance / price('rosee')));
      if (qty < 1) break;
      store.buyPacks('rosee', qty);
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

console.log('\nGarde-fous et robustesse');
{
  const st = () => store.getState();
  resetStock();
  store.resetDemo();
  store.signup('Gardien');
  check(reservedAtStart > 0, `lots de giveaway mis de côté dès le chargement (${reservedAtStart} cartes)`);

  // Compteurs durables : le journal est plafonné, il ne sert plus de source de vérité.
  const d1 = store.deposit(100_00);
  st().tx.length = 0;
  const d2 = store.deposit(100_00);
  check(d1.bonus > 0 && d2.bonus === 0, 'bonus de premier dépôt versé une seule fois, même journal vidé');
  const cheap = PACKS.filter(packAvailable).sort((a, b) => a.price - b.price)[0];
  // La dépense du jour survit à la réinitialisation (sinon elle servirait à contourner la limite).
  const spentBefore = store.spentToday();
  store.buyPacks(cheap.slug, 2);
  st().tx.length = 0;
  check(store.spentToday() === spentBefore + cheap.price * 2 && store.stats().spent === cheap.price * 2, 'dépense du jour et cumul des achats tenus hors du journal');
  {
    // Contournement de la limite : réinitialiser la démo ne remet pas le compteur du jour à zéro.
    const before = store.spentToday();
    store.resetDemo();
    store.signup('Gardien');
    check(store.spentToday() === before, 'la dépense du jour survit à la réinitialisation');
    check(!store.setDailyLimit(Number.NaN).ok && !store.setPause(Number.POSITIVE_INFINITY).ok, 'limite ou pause non finies refusées');
  }

  // Limite : une baisse est immédiate, un relèvement ou un retrait est différé.
  store.setDailyLimit(50_00);
  const raise = store.setDailyLimit(100_00);
  check(st().limits.daily === 50_00 && raise.from > Date.now() && st().limits.pending?.daily === 100_00, `relèvement de limite différé de ${RULES.limitRaiseDelayHours} h`);
  const lower = store.setDailyLimit(20_00);
  check(st().limits.daily === 20_00 && lower.from === null && st().limits.pending === null, 'baisse de limite immédiate, relèvement en attente annulé');
  const removal = store.setDailyLimit(null);
  check(st().limits.daily === 20_00 && removal.from > Date.now(), 'retrait de limite différé');
  check(store.buyPacks(cheap.slug, 3).code === 'limit' || cheap.price * 5 <= 20_00, "la limite en vigueur bloque l'achat qui la dépasserait");
  st().limits.pending.from = Date.now() - 1;
  check(store.dailyLimit().daily === null && st().limits.pending === null, 'le changement différé prend effet à son échéance');

  // Pause : elle bloque aussi recharges, roue et participations, et ne se lève pas.
  store.setPause(24);
  const until = st().limits.pauseUntil;
  check(store.deposit(10_00).code === 'pause' && store.buyPacks(cheap.slug, 1).code === 'pause' && store.updateGiveaway('brasier', { joined: true }).code === 'pause', 'pause : recharges, achats et participations suspendus');
  check(store.setPause(0).ok === false && st().limits.pauseUntil === until, 'une pause ne se lève pas avant son terme');
  store.resetDemo();
  check(st().limits.pauseUntil === until, 'réinitialiser la démo ne lève pas la pause');
  st().limits.pauseUntil = 0;

  // Tickets de giveaway : ceux d'un mois passé ne comptent plus.
  store.signup('Gardien');
  const event = PACKS.find((p) => p.giveaway && packAvailable(p));
  if (event) {
    store.deposit(200_00);
    store.buyPacks(event.slug, 1);
    check(store.giveawayEntry(event.giveaway).tickets === 1, 'un pack événement donne un ticket');
    st().giveaways[event.giveaway].period = '2000-01';
    check(store.giveawayEntry(event.giveaway).tickets === 0, "les tickets d'un mois passé ne comptent plus");
  }

  // Tirage vérifiable : la graine serveur suivante est engagée avant le choix de la graine client.
  const committed = st().fair.next.serverHash;
  store.rotateSeeds('graine-du-joueur');
  check(st().fair.serverHash === committed && st().fair.next.serverHash !== committed && sha256Hex(st().fair.serverSeed) === committed, 'après renouvellement, la graine serveur est celle dont l’empreinte était déjà affichée');
  const table = packTable(cheap);
  check(/^[0-9a-f]{64}$/.test(table.digest) && table.version === table.digest.slice(0, 12), 'empreinte complète de la table, la version affichée en est le début');
  const lastRoll = st().rolls.find((r) => r.game.startsWith('pack:'));
  check(Boolean(lastRoll?.outcome.digest), 'le journal garde l’empreinte complète de la table de chaque tirage');
  check(store.wheelFactor(0) === RULES.cashback.wheel[0][0] && store.wheelFactor(TICKETS - 1) === RULES.cashback.wheel.at(-1)[0], 'barème de la roue lisible par la page de vérification');

  // Règles économiques fermées par l'audit.
  const { wagering, fullWeightEdge } = RULES.bonus;
  const open = PACKS.filter(packAvailable);
  check(open.every((p) => (wagering * packEdge(p)) / store.wagerWeight(packEdge(p)) >= wagering * Math.min(packEdge(p), fullWeightEdge) - 1e-9 && (wagering * packEdge(p)) / store.wagerWeight(packEdge(p)) >= 1 - 1e-9), `bonus : jouer ${wagering} fois coûte au moins le bonus sur chaque pack (mises pondérées par la marge)`);
  const sample = stockCards().find((c) => c.value >= 20_00);
  const lockMs = RULES.buybackLockMinutes * 60_000;
  const fresh = { cardId: sample.id, value: sample.value, at: Date.now() };
  const old = { cardId: sample.id, value: sample.value, at: Date.now() - 2 * lockMs };
  setPrice(sample.id, Math.round(sample.value / 2));
  check(store.buybackOf(fresh) === Math.round(sample.value * RULES.buybackRate) && store.buybackOf(old) === Math.round(Math.round(sample.value / 2) * RULES.buybackLaterRate), 'cote retenue : celle du tirage pendant la garantie, ensuite la plus basse (tirage ou jour)');
  setPrice(sample.id, null);
  check(store.lockEnd({ at: Date.now(), lockAt: 1000 }) === 1000 + lockMs, "Évolution : la carte gagnée hérite de la garantie de la carte misée (pas de détour par un rachat à plein taux)");

  // Inventaire importé : rien d'autre que les champs attendus n'entre.
  check(imgUrl('https://images.pokemontcg.io/base1/4.png') !== '' && imgUrl('https://images.pokemontcg.io/base1/4.png\'"><img src=x onerror=alert(1)>').includes('<') === false && imgUrl('https://evil.example/x.png') === '' && imgUrl('javascript:alert(1)') === '', "adresses d'image : hôte attendu seulement, rien d'injectable");
  const hostile = { format: 'coffreo-stock', version: 1, date: '2026-01-01', items: { 'zz-1': { q: 2, c: { id: 'autre', name: 'x'.repeat(500), nameEn: 'Test', set: 'S', value: '12', img: 'https://evil.example/a.png"><script>', imgHi: 'javascript:alert(1)', extra: '<b>' } }, 'zz-2': null, 'zz-3': { q: 5 } } };
  importStock(hostile);
  const kept = exportStock().items['zz-1'];
  check(kept && kept.c.id === 'zz-1' && kept.c.name.length === 80 && kept.c.img === '' && kept.c.imgHi === '' && kept.c.value === 12 && !('extra' in kept.c) && !exportStock().items['zz-2'] && !exportStock().items['zz-3'], 'inventaire importé : fiche réduite aux champs attendus, entrées invalides écartées');
  resetStock();
  store.resetDemo();
}

console.log('\nIllustrations');
{
  const exists = (rel) => fs.existsSync(new URL(`../${rel}`, import.meta.url));
  const missing = PACKS.filter((p) => !exists(`assets/packs/${p.slug}.webp`)).map((p) => p.slug);
  check(missing.length === 0, `chaque pack a son illustration (${missing.length ? `manquent : ${missing.join(', ')}` : PACKS.length + ' fichiers'})`);
  const heavy = PACKS.filter((p) => exists(`assets/packs/${p.slug}.webp`) && fs.statSync(new URL(`../assets/packs/${p.slug}.webp`, import.meta.url)).size > 200_000).map((p) => p.slug);
  check(heavy.length === 0, 'illustrations sous 200 Ko chacune');
  check(['favicon.svg', 'icon-180.png', 'icon-512.png'].every((f) => exists(`assets/brand/${f}`)), "icône d'onglet et icônes d'application présentes");
}

console.log('\nThèmes');
const css = fs.readFileSync(new URL('../css/themes.css', import.meta.url), 'utf8');
const init = fs.readFileSync(new URL('../js/theme-init.js', import.meta.url), 'utf8');
check(THEMES.every((t) => css.includes(`[data-theme='${t.id}']`)), `${THEMES.length} thèmes présents dans css/themes.css`);
check(THEMES.every((t) => init.includes(`'${t.id}'`)), 'identifiants repris dans js/theme-init.js');
check(THEMES.every((t) => CARDS.some((c) => (!t.match.types || t.match.types.includes(c.type)) && (!t.match.names || t.match.names.test(c.nameEn)))), 'chaque thème a une carte pour l’illustrer');

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTout est bon.');
process.exit(failures ? 1 : 0);
