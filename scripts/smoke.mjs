#!/usr/bin/env node
// Contrôles rapides, sans navigateur : cohérence des données et du tirage.
//   node scripts/smoke.mjs

import { PACKS, RARITIES } from '../js/data/packs.js';
import { CARDS, expectedValue, tierPool } from '../js/catalog.js';
import { isTranslated } from '../js/data/names-fr.js';
import { drawFromPack } from '../js/draw.js';
import { listGiveaways } from '../js/data/giveaways.js';
import { RULES } from '../js/config.js';

let failures = 0;
const check = (ok, message) => {
  if (!ok) failures++;
  console.log(`${ok ? '  ok ' : 'ÉCHEC'}  ${message}`);
};

console.log('Catalogue');
check(CARDS.length >= 200, `${CARDS.length} cartes`);
check(new Set(CARDS.map((c) => c.id)).size === CARDS.length, 'identifiants uniques');
check(CARDS.every((c) => Number.isInteger(c.value) && c.value > 0), 'cotes entières en centimes');
check(CARDS.every((c) => /^https:\/\/images\.pokemontcg\.io\/[a-z0-9]+\/[A-Za-z0-9]+\.png$/.test(c.img)), "adresses d'images valides");
const untranslated = [...new Set(CARDS.filter((c) => !isTranslated(c.nameEn)).map((c) => c.nameEn))];
check(untranslated.length === 0, `noms français (${untranslated.length} manquant${untranslated.length > 1 ? 's' : ''}${untranslated.length ? ` : ${untranslated.slice(0, 5).join(', ')}` : ''})`);

console.log('\nPacks');
for (const pack of PACKS) {
  const total = pack.tiers.reduce((s, t) => s + t.p, 0);
  check(Math.abs(total - 100) < 1e-9, `${pack.slug} : probabilités = ${total} %`);
  check(pack.tiers.every((t) => RARITIES[t.rarity]), `${pack.slug} : raretés connues`);
  check(pack.tiers.every((t, i) => i === 0 || t.min > pack.tiers[i - 1].max), `${pack.slug} : paliers croissants et disjoints`);
  const sizes = pack.tiers.map((_, i) => tierPool(pack, i).length);
  check(sizes.every((n) => n >= 3), `${pack.slug} : cartes par palier ${sizes.join(' / ')}`);
  if (pack.types) {
    const themed = pack.tiers.every((_, i) => tierPool(pack, i).every((c) => pack.types.includes(c.type)));
    check(themed, `${pack.slug} : tous les paliers respectent le thème (${pack.types.join(', ')})`);
  }
}

console.log('\nTirage (200 000 tirages par pack)');
for (const pack of PACKS) {
  const n = 200_000;
  const seen = new Array(pack.tiers.length).fill(0);
  let sum = 0;
  let inRange = true;
  for (let i = 0; i < n; i++) {
    const { card, tierIndex } = drawFromPack(pack);
    seen[tierIndex]++;
    sum += card.value;
    const t = pack.tiers[tierIndex];
    if (card.value < t.min * 100 || card.value > t.max * 100 + 99) inRange = false;
  }
  const worst = Math.max(...pack.tiers.map((t, i) => Math.abs((seen[i] / n) * 100 - t.p)));
  check(worst < 0.4, `${pack.slug} : fréquences observées conformes (écart max ${worst.toFixed(2)} point)`);
  check(inRange, `${pack.slug} : chaque carte tombe dans son palier`);
  const ev = expectedValue(pack);
  check(Math.abs(sum / n - ev) / ev < 0.02, `${pack.slug} : cote moyenne ${(ev / 100).toFixed(2)} € (simulée ${(sum / n / 100).toFixed(2)} €), retour en revente ${Math.round(((ev * RULES.buybackRate) / pack.price) * 100)} %`);
}

console.log('\nGiveaways');
for (const g of listGiveaways()) {
  check(g.lots.length > 0 && g.total > 0, `${g.id} : ${g.lots.length} lots, ${(g.total / 100).toFixed(2)} €`);
  check(g.end > g.start && g.drawAt > g.end, `${g.id} : dates cohérentes`);
}

console.log(failures ? `\n${failures} contrôle(s) en échec` : '\nTout est bon.');
process.exit(failures ? 1 : 0);
