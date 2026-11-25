#!/usr/bin/env node
// Contrôles rapides, sans navigateur : données, tables de tirage, équité, retour théorique.
//   node scripts/smoke.mjs

import crypto from 'node:crypto';
import { RULES } from '../js/config.js';
import { CARDS, dropTable, expectedValue, packReturn, resolveTicket, tierPool } from '../js/catalog.js';
import { BADGES, progress } from '../js/data/badges.js';
import { listGiveaways } from '../js/data/giveaways.js';
import { isTranslated } from '../js/data/names-fr.js';
import { PACKS, RARITIES } from '../js/data/packs.js';
import { THEMES } from '../js/data/themes.js';
import { drawFromPack } from '../js/draw.js';
import { TICKETS, hmacHex, sha256Hex, ticketFor } from '../js/fair.js';
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

console.log('\nPacks');
for (const pack of PACKS) {
  const total = pack.tiers.reduce((s, t) => s + t.p, 0);
  check(Math.abs(total - 100) < 1e-9, `${pack.slug} : probabilités des paliers = ${total.toFixed(1)} %`);
  check(pack.tiers.every((t) => RARITIES[t.rarity]) && pack.tiers.every((t, i) => i === 0 || t.min > pack.tiers[i - 1].max), `${pack.slug} : paliers croissants, disjoints, raretés connues`);
  const sizes = pack.tiers.map((_, i) => tierPool(pack, i).length);
  check(sizes.every((n) => n >= 3), `${pack.slug} : cartes par palier ${sizes.join(' / ')}`);

  const table = dropTable(pack);
  const contiguous = table.every((d, i) => d.from === (i ? table[i - 1].to : 0) && d.to > d.from);
  check(contiguous && table[table.length - 1].to === TICKETS, `${pack.slug} : table de ${table.length} cartes, ${TICKETS} tickets sans trou ni recouvrement`);
  const tierOk = pack.tiers.every((t, i) => {
    const tickets = table.filter((d) => d.tierIndex === i).reduce((s, d) => s + (d.to - d.from), 0);
    return tickets === Math.round((t.p / 100) * TICKETS);
  });
  check(tierOk, `${pack.slug} : chaque palier pèse exactement sa probabilité publiée`);
  check([0, 1, 499_999, TICKETS - 1].every((t) => { const d = resolveTicket(pack, t); return t >= d.from && t < d.to; }), `${pack.slug} : résolution des tickets`);

  const ret = packReturn(pack);
  check(Math.abs(ret - RULES.targetReturn) <= 0.01, `${pack.slug} : retour théorique ${(ret * 100).toFixed(1)} % (cible ${RULES.targetReturn * 100} % ± 1), cote moyenne ${(expectedValue(pack) / 100).toFixed(2)} € pour ${(pack.price / 100).toFixed(2)} €`);
}

console.log('\nTirage libre (200 000 tirages par pack)');
for (const pack of PACKS) {
  const n = 200_000;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += drawFromPack(pack).card.value;
  const ev = expectedValue(pack);
  check(Math.abs(sum / n - ev) / ev < 0.03, `${pack.slug} : cote moyenne simulée ${(sum / n / 100).toFixed(2)} € (théorique ${(ev / 100).toFixed(2)} €)`);
}

console.log('\nAutres jeux');
check(RULES.dailyReward.reduce((s, [, t]) => s + t, 0) === TICKETS, 'récompense du jour : le barème couvre tous les tickets');
check(BADGES.every((b, i) => i === 0 || b.xp > BADGES[i - 1].xp) && progress(0).current === BADGES[0] && progress(1e9).next === null, 'badges : seuils croissants');
check(BADGES.every((b) => THEMES.some((t) => t.id === b.theme)), 'badges : chacun rattaché à un thème');

console.log('\nThèmes');
const css = fs.readFileSync(new URL('../css/themes.css', import.meta.url), 'utf8');
const init = fs.readFileSync(new URL('../js/theme-init.js', import.meta.url), 'utf8');
check(THEMES.every((t) => css.includes(`[data-theme='${t.id}']`)), `${THEMES.length} thèmes présents dans css/themes.css`);
check(THEMES.every((t) => init.includes(`'${t.id}'`)), 'identifiants repris dans js/theme-init.js');
check(THEMES.every((t) => CARDS.some((c) => (!t.match.types || t.match.types.includes(c.type)) && (!t.match.names || t.match.names.test(c.nameEn)))), 'chaque thème a une carte pour l’illustrer');

console.log('\nGiveaways');
for (const g of listGiveaways()) {
  check(g.lots.length > 0 && g.total > 0 && g.end > g.start && g.drawAt > g.end, `${g.id} : ${g.lots.length} lots, ${(g.total / 100).toFixed(2)} €, dates cohérentes`);
}

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTout est bon.');
process.exit(failures ? 1 : 0);
