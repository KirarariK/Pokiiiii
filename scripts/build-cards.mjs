#!/usr/bin/env node
// Génère js/data/cards.js à partir de l'API publique Pokémon TCG (pokemontcg.io).
//
//   node scripts/build-cards.mjs [--cache <dossier>] [--names]
//
// --cache  dossier où lire/écrire les réponses de l'API (un fichier par extension) ;
//          permet de relancer la génération sans retélécharger.
// --names  affiche les noms de cartes qui n'ont pas de traduction française.
//
// Les cotes sont celles de Cardmarket telles que relayées par l'API (moyenne
// 30 jours, en euros). Ce sont des cotes INDICATIVES pour la démonstration :
// en production, la valeur de référence vient de l'inventaire réel.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'js/data/cards.js');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const CACHE = opt('--cache') || path.join(ROOT, '.cache/tcg');

/** Extensions interrogées : identifiant API -> nom français et code affiché. */
const SETS = {
  base1: { name: 'Set de Base', code: 'BS' },
  base2: { name: 'Jungle', code: 'JU' },
  base3: { name: 'Fossile', code: 'FO' },
  base5: { name: 'Team Rocket', code: 'TR' },
  gym1: { name: 'Gym Heroes', code: 'G1' },
  gym2: { name: 'Gym Challenge', code: 'G2' },
  neo1: { name: 'Neo Genesis', code: 'N1' },
  neo2: { name: 'Neo Discovery', code: 'N2' },
  neo3: { name: 'Neo Revelation', code: 'N3' },
  neo4: { name: 'Neo Destiny', code: 'N4' },
  xy12: { name: 'Évolutions', code: 'EVO' },
  g1: { name: 'Générations', code: 'GEN' },
  sm35: { name: 'Légendes Brillantes', code: 'SLG' },
  sm75: { name: 'Majesté des Dragons', code: 'DRM' },
  sm8: { name: 'Tonnerre Perdu', code: 'LOT' },
  sm9: { name: 'Duo de Choc', code: 'TEU' },
  sm10: { name: 'Alliance Infaillible', code: 'UNB' },
  sm11: { name: 'Harmonie des Esprits', code: 'UNM' },
  sm12: { name: 'Éclipse Cosmique', code: 'CEC' },
  sm115: { name: 'Destinées Occultes', code: 'HIF' },
  sma: { name: 'Destinées Occultes · Chromatiques', code: 'HIF' },
  swsh35: { name: 'La Voie du Maître', code: 'CPA' },
  swsh45sv: { name: 'Destinées Radieuses · Chromatiques', code: 'SHF' },
  swsh3: { name: 'Ténèbres Embrasées', code: 'DAA' },
  swsh4: { name: 'Voltage Éclatant', code: 'VIV' },
  swsh5: { name: 'Styles de Combat', code: 'BST' },
  swsh6: { name: 'Règne de Glace', code: 'CRE' },
  swsh7: { name: 'Évolution Céleste', code: 'EVS' },
  cel25: { name: 'Célébrations', code: 'CEL' },
  cel25c: { name: 'Célébrations · Collection Classique', code: 'CEL' },
  swsh8: { name: 'Poing de Fusion', code: 'FST' },
  swsh9: { name: 'Stars Étincelantes', code: 'BRS' },
  swsh9tg: { name: 'Stars Étincelantes · Galerie des Dresseurs', code: 'BRS' },
  swsh10: { name: 'Astres Radieux', code: 'ASR' },
  swsh10tg: { name: 'Astres Radieux · Galerie des Dresseurs', code: 'ASR' },
  pgo: { name: 'Pokémon GO', code: 'PGO' },
  swsh11: { name: 'Origine Perdue', code: 'LOR' },
  swsh11tg: { name: 'Origine Perdue · Galerie des Dresseurs', code: 'LOR' },
  swsh12: { name: 'Tempête Argentée', code: 'SIT' },
  swsh12pt5: { name: 'Zénith Suprême', code: 'CRZ' },
  swsh12pt5gg: { name: 'Zénith Suprême · Galerie de Galar', code: 'CRZ' },
  swshp: { name: 'Promos Épée et Bouclier', code: 'SWSH' },
  svp: { name: 'Promos Écarlate et Violet', code: 'SVP' },
  sv1: { name: 'Écarlate et Violet', code: 'SVI' },
  sv2: { name: 'Évolutions à Paldea', code: 'PAL' },
  sv3: { name: 'Flammes Obsidiennes', code: 'OBF' },
  sv3pt5: { name: '151', code: 'MEW' },
  sv4: { name: 'Faille Paradoxe', code: 'PAR' },
  sv4pt5: { name: 'Destinées de Paldea', code: 'PAF' },
  sv5: { name: 'Forces Temporelles', code: 'TEF' },
  sv6: { name: 'Mascarade Crépusculaire', code: 'TWM' },
  sv6pt5: { name: 'Fable Nébuleuse', code: 'SFA' },
  sv7: { name: 'Couronne Stellaire', code: 'SCR' },
  sv8: { name: 'Étincelles Déferlantes', code: 'SSP' },
  sv8pt5: { name: 'Évolutions Prismatiques', code: 'PRE' },
  sv9: { name: 'Aventures Ensemble', code: 'JTG' },
  sv10: { name: 'Rivalités Destinées', code: 'DRI' },
  zsv10pt5: { name: 'Foudre Noire', code: 'BLK' },
  rsv10pt5: { name: 'Flamme Blanche', code: 'WHT' },
  me1: { name: 'Méga-Évolution', code: 'MEG' },
  me2: { name: 'Flammes Fantasmagoriques', code: 'PFL' },
  me2pt5: { name: 'Héros Transcendants', code: 'ASC' },
  me3: { name: 'Perfect Order', code: 'POR' },
  me55: { name: '30e Anniversaire', code: '30C' },
  me55c: { name: '30e Anniversaire · Collection Classique', code: '30CC' },
};

const MIN_VALUE = 4_00;
const MAX_VALUE = 1050_99;

/** Tranches de cote (centimes) et nombre maximal de cartes conservées par tranche. */
const BUCKETS = [
  [4_00, 6_99, 48],
  [7_00, 9_99, 42],
  [10_00, 15_99, 46],
  [16_00, 25_99, 46],
  [26_00, 50_99, 56],
  [51_00, 99_99, 70],
  [100_00, 199_99, 60],
  [200_00, MAX_VALUE, 60],
];

/** Espèces mises en avant quand une tranche déborde. */
const STARS = ['Charizard', 'Pikachu', 'Eevee', 'Umbreon', 'Espeon', 'Sylveon', 'Vaporeon', 'Jolteon', 'Flareon', 'Leafeon', 'Glaceon', 'Mewtwo', 'Mew', 'Rayquaza', 'Lugia', 'Gengar', 'Dragonite', 'Blastoise', 'Venusaur', 'Gyarados', 'Snorlax', 'Lucario', 'Greninja', 'Gardevoir', 'Giratina', 'Arceus', 'Garchomp', 'Tyranitar', 'Charmander', 'Squirtle', 'Bulbasaur', 'Suicune', 'Ho-Oh', 'Zekrom', 'Reshiram', 'Latias', 'Latios', 'Magikarp', 'Psyduck', 'Dialga', 'Palkia'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchSet(id) {
  const file = path.join(CACHE, `set_${id}.json`);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')).data;
    } catch {
      /* cache illisible : on retélécharge */
    }
  }
  const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${id}&pageSize=250&select=id,name,number,rarity,supertype,subtypes,types,set,images,cardmarket`;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        fs.mkdirSync(CACHE, { recursive: true });
        fs.writeFileSync(file, JSON.stringify(json));
        return json.data;
      }
    } catch {
      /* l'API renvoie souvent des 5xx passagers : on réessaie */
    }
    await sleep(3000);
  }
  console.warn(`! extension ${id} indisponible, ignorée`);
  return [];
}

/** Cote retenue en centimes, ou null si les prix sont absents ou incohérents. */
function valueOf(card) {
  const p = card.cardmarket?.prices;
  if (!p) return null;
  const avg = p.avg30;
  const trend = p.trendPrice;
  if (!(avg > 0) || !(trend > 0)) return null;
  const ratio = trend / avg;
  if (ratio < 0.6 || ratio > 1.7) return null; // cote instable ou variantes mélangées
  return Math.round(avg * 100);
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
for (const id of Object.keys(SETS)) {
  const cards = await fetchSet(id);
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
    const score = (c) => (c.type === 'Fire' && c.value >= 18_00 ? 2 : 0) + (isStar(c.name) ? 1 : 0);
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
