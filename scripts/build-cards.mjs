#!/usr/bin/env node
// Génère js/data/cards.js à partir de l'API publique Pokémon TCG (pokemontcg.io).
//
//   node scripts/build-cards.mjs [--cache <dossier>] [--names]
//
// --cache  dossier où lire/écrire les réponses de l'API ; le même que pour
//          scripts/build-catalogue.mjs, ce qui évite de retélécharger.
// --names  affiche les noms de cartes qui n'ont pas de traduction française.
//
// Les cotes sont celles de Cardmarket telles que relayées par l'API, en euros ; la cote retenue
// est la cote prudente de scripts/prudent-price.mjs (jamais au-dessus de la moyenne 30 jours). Ce sont des cotes INDICATIVES pour la démonstration :
// en production, la valeur de référence vient de l'inventaire réel.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SETS } from './sets-fr.mjs';
import { prudentPrice } from './prudent-price.mjs';
import { fetchSetCards } from './tcg-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'js/data/cards.js');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const CACHE = opt('--cache') || path.join(ROOT, '.cache/tcg');

const MIN_VALUE = 4_00;
const MAX_VALUE = 1600_00;

/**
 * Tranches de cote (centimes) et nombre maximal de cartes conservées par tranche.
 * Au-delà de 26 €, tout est gardé : les cartes chères sont rares et font les gros lots.
 */
const BUCKETS = [
  [4_00, 6_99, 80],
  [7_00, 9_99, 80],
  [10_00, 15_99, 90],
  [16_00, 25_99, 80],
  [26_00, MAX_VALUE, Infinity],
];

/** Extensions de l'ère Wizards of the Coast : alimentent le pack « Rétro ». */
const VINTAGE = ['base1', 'base2', 'base3', 'base5', 'gym1', 'gym2', 'neo1', 'neo2', 'neo3', 'neo4'];

/** Famille Évoli : alimente le pack « Évoli ». */
const EEVEE = /(Eevee|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon)/;

/** Espèces mises en avant quand une tranche déborde. */
const STARS = ['Charizard', 'Pikachu', 'Mewtwo', 'Mew', 'Rayquaza', 'Lugia', 'Gengar', 'Dragonite', 'Blastoise', 'Venusaur', 'Gyarados', 'Snorlax', 'Lucario', 'Greninja', 'Gardevoir', 'Giratina', 'Arceus', 'Garchomp', 'Tyranitar', 'Charmander', 'Squirtle', 'Bulbasaur', 'Suicune', 'Ho-Oh', 'Zekrom', 'Reshiram', 'Latias', 'Latios', 'Magikarp', 'Psyduck', 'Dialga', 'Palkia'];

/** Cote retenue en centimes, ou null si les prix sont absents ou incohérents. */
function valueOf(card) {
  const p = card.cardmarket?.prices;
  if (!p) return null;
  const avg = p.avg30;
  const trend = p.trendPrice;
  if (!(avg > 0) || !(trend > 0)) return null;
  const ratio = trend / avg;
  if (ratio < 0.6 || ratio > 1.7) return null; // cote instable ou variantes mélangées
  return Math.round(prudentPrice(p, { updatedAt: card.cardmarket.updatedAt }) * 100);
}

function hash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const isStar = (name) => STARS.some((s) => new RegExp(`(^|[ '’-])${s}($|[ '’-])`).test(name));

const candidates = [];
let pricesDate = '';
let oldestDate = '9999';
for (const id of Object.keys(SETS)) {
  let cards = [];
  try {
    cards = await fetchSetCards(CACHE, id);
  } catch {
    console.warn(`! extension ${id} indisponible, ignorée`);
  }
  let kept = 0;
  for (const c of cards) {
    if (c.supertype !== 'Pokémon') continue;
    if (/V-UNION/.test(c.name)) continue; // carte en quatre morceaux : un morceau seul n'est pas un lot présentable
    if (!c.rarity || c.rarity === 'Common' || c.rarity === 'Uncommon') continue;
    const value = valueOf(c);
    if (value == null || value < MIN_VALUE || value > MAX_VALUE) continue;
    const expected = `https://images.pokemontcg.io/${id}/${c.number}.png`;
    if (c.images?.small !== expected) continue;
    const updated = (c.cardmarket.updatedAt || '').replace(/\//g, '-');
    if (updated > pricesDate) pricesDate = updated;
    if (updated < oldestDate) oldestDate = updated;
    candidates.push({ id: c.id, name: c.name, value, rarity: c.rarity, type: c.types?.[0] || 'Colorless' });
    kept++;
  }
  console.log(`${id.padEnd(12)} ${String(cards.length).padStart(3)} cartes, ${String(kept).padStart(3)} retenues`);
}

// Échantillonnage par tranche : les cartes de type Feu (pack thématique) et les
// espèces vedettes passent en premier, puis un ordre stable pseudo-aléatoire.
const selected = [];
for (const [lo, hi, cap] of BUCKETS) {
  const inBucket = candidates.filter((c) => c.value >= lo && c.value <= hi);
  inBucket.sort((a, b) => {
    const themed = (c) => VINTAGE.includes(c.id.slice(0, c.id.lastIndexOf('-'))) || EEVEE.test(c.name) || (c.type === 'Fire' && c.value >= 18_00);
    const score = (c) => (themed(c) ? 2 : 0) + (isStar(c.name) ? 1 : 0);
    return score(b) - score(a) || hash(a.id) - hash(b.id);
  });
  selected.push(...inBucket.slice(0, cap));
  console.log(`tranche ${(lo / 100).toFixed(0).padStart(4)}–${(hi / 100).toFixed(0).padEnd(4)} € : ${inBucket.length} candidates, ${Math.min(cap, inBucket.length)} gardées`);
}
selected.sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));

const usedSets = [...new Set(selected.map((c) => c.id.slice(0, c.id.lastIndexOf('-'))))];
const setsOut = Object.fromEntries(Object.entries(SETS).filter(([id]) => usedSets.includes(id)));

const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const lines = selected.map((c) => `  [${q(c.id)}, ${q(c.name)}, ${c.value}, ${q(c.rarity)}, ${q(c.type)}],`);

fs.writeFileSync(
  OUT,
  `// Fichier généré par scripts/build-cards.mjs — ne pas modifier à la main.
// Données : API Pokémon TCG (pokemontcg.io) ; cotes Cardmarket, moyenne 30 jours.
// Cotes indicatives pour la démonstration, relevées le ${pricesDate}.

export const PRICES_DATE = '${pricesDate}';
/** Relevé le plus ancien : les prix de plus de six mois sont abaissés de 10 % (voir scripts/prudent-price.mjs). */
export const PRICES_OLDEST = '${oldestDate}';

/** Extensions : identifiant API -> nom français et code affiché. */
export const SETS = ${JSON.stringify(setsOut, null, 2).replace(/"([a-zA-Z0-9]+)":/g, '$1:').replace(/"/g, "'")};

/** Cartes : [identifiant, nom imprimé, cote en centimes, rareté imprimée, type]. */
export const CARDS = [
${lines.join('\n')}
];
`,
);

console.log(`\n${selected.length} cartes écrites dans ${path.relative(ROOT, OUT)} (cotes du ${pricesDate})`);

if (flag('--names')) {
  const { nameFr, isTranslated } = await import(path.join(ROOT, 'js/data/names-fr.js'));
  const missing = [...new Set(selected.map((c) => c.name))].filter((n) => !isTranslated(n)).sort();
  console.log(`\n${missing.length} nom(s) sans traduction :`);
  missing.forEach((n) => console.log(`  ${n}  ->  ${nameFr(n)}`));
}
