// Catalogue de cartes et tables de tirage des packs.
//
// Une table de tirage découpe 1 000 000 de tickets entre les cartes d'un pack.
// Chaque carte y occupe une plage [from, to) : sa probabilité est la taille de
// sa plage divisée par le nombre de tickets. C'est cette table, publiée sur la
// page du pack, qui fait foi : le tirage ne fait que désigner un ticket.

import { RULES } from './config.js';
import { CARDS as RAW, SETS } from './data/cards.js';
import { nameFr } from './data/names-fr.js';
import { TICKETS, sha256Hex } from './fair.js';

const IMG = 'https://images.pokemontcg.io';

/**
 * @typedef {Object} Card
 * @property {string} id        identifiant API (ex. « sv3pt5-199 »)
 * @property {string} name      nom affiché (français quand il est connu)
 * @property {string} nameEn    nom imprimé sur la carte
 * @property {string} setId     identifiant de l'extension
 * @property {string} set       nom de l'extension
 * @property {string} code      code de l'extension (ex. « MEW »)
 * @property {string} number    numéro dans l'extension
 * @property {number} value     cote indicative, en centimes
 * @property {string} type      type principal (anglais, tel que fourni par l'API)
 * @property {string} tcgRarity rareté imprimée
 * @property {string} img       image basse définition
 * @property {string} imgHi     image haute définition
 */

/** @type {Card[]} du plus coté au moins coté */
export const CARDS = RAW.map(([id, nameEn, value, tcgRarity, type]) => {
  const cut = id.lastIndexOf('-');
  const setId = id.slice(0, cut);
  const number = id.slice(cut + 1);
  const set = SETS[setId] || { name: setId, code: setId.toUpperCase() };
  return {
    id,
    name: nameFr(nameEn),
    nameEn,
    setId,
    set: set.name,
    code: set.code,
    number,
    value,
    type,
    tcgRarity,
    img: `${IMG}/${setId}/${number}.png`,
    imgHi: `${IMG}/${setId}/${number}_hires.png`,
  };
});

const BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/** @returns {Card|undefined} */
export const cardById = (id) => BY_ID.get(id);

/** Référence courte façon classeur : « MEW 199 » (les promos portent déjà leur code : « SWSH141 »). */
export const cardRef = (card) => (card.number.startsWith(card.code) ? card.number : `${card.code} ${card.number}`);

/** Une carte entre-t-elle dans la sélection d'un pack thématique ? */
function matches(card, filter) {
  if (!filter) return true;
  if (filter.types && !filter.types.includes(card.type)) return false;
  if (filter.sets && !filter.sets.includes(card.setId)) return false;
  if (filter.names && !filter.names.test(card.nameEn)) return false;
  return true;
}

/** Cartes d'un palier : cote dans [min, max] euros (bornes incluses) et dans le thème du pack. */
export function tierPool(pack, tierIndex) {
  const tier = pack.tiers[tierIndex];
  const lo = tier.min * 100;
  const hi = tier.max * 100 + 99;
  return CARDS.filter((c) => c.value >= lo && c.value <= hi && matches(c, pack.filter));
}

/**
 * Répartit `total` tickets selon des poids, au plus fort reste, en garantissant
 * au moins un ticket par élément. La somme rendue vaut exactement `total`.
 */
function allocate(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const shares = exact.map((x) => Math.max(1, Math.floor(x)));
  let diff = total - shares.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; diff > 0; k = (k + 1) % order.length, diff--) shares[order[k][1]]++;
  // Si le minimum garanti a fait déborder, on reprend sur les plus grosses parts.
  while (diff < 0) {
    const big = shares.indexOf(Math.max(...shares));
    shares[big]--;
    diff++;
  }
  return shares;
}

/**
 * @typedef {Object} Drop
 * @property {Card} card
 * @property {string} rarity     rareté du palier
 * @property {number} tierIndex
 * @property {number} from       premier ticket (inclus)
 * @property {number} to         dernier ticket (exclu)
 * @property {number} p          probabilité, entre 0 et 1
 */

const tables = new Map();

/**
 * Table de tirage d'un pack, des plus gros lots (petits tickets) aux plus petits.
 * Dans un palier, le poids d'une carte vaut (cote plancher / cote)^skew :
 * skew = 0 donne des cartes équiprobables, 1 une probabilité inversement
 * proportionnelle à la cote.
 * @returns {Drop[]}
 */
export function dropTable(pack) {
  if (tables.has(pack.slug)) return tables.get(pack.slug);
  const skew = pack.skew ?? RULES.tierSkew;
  const drops = [];
  let cursor = 0;
  for (let i = pack.tiers.length - 1; i >= 0; i--) {
    const tier = pack.tiers[i];
    const pool = tierPool(pack, i).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
    const tickets = Math.round((tier.p / 100) * TICKETS);
    if (!pool.length) throw new Error(`Pack « ${pack.slug} » : aucune carte pour le palier ${tier.min}–${tier.max} €`);
    const floor = pool[pool.length - 1].value;
    const shares = allocate(pool.map((c) => Math.pow(floor / c.value, skew)), tickets);
    pool.forEach((card, j) => {
      drops.push({ card, rarity: tier.rarity, tierIndex: i, from: cursor, to: cursor + shares[j], p: shares[j] / TICKETS });
      cursor += shares[j];
    });
  }
  if (cursor !== TICKETS) throw new Error(`Pack « ${pack.slug} » : la table couvre ${cursor} tickets au lieu de ${TICKETS}`);
  tables.set(pack.slug, drops);
  return drops;
}

/** Lot correspondant à un ticket (recherche dichotomique). @returns {Drop} */
export function resolveTicket(pack, ticket) {
  const table = dropTable(pack);
  let lo = 0;
  let hi = table.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ticket >= table[mid].to) lo = mid + 1;
    else hi = mid;
  }
  return table[lo];
}

/** Les plus grosses cartes d'un pack. @returns {Drop[]} */
export const topHits = (pack, n = 10) => dropTable(pack).slice(0, n);

/** Cote moyenne d'une carte tirée dans un pack, en centimes. */
export const expectedValue = (pack) => Math.round(dropTable(pack).reduce((sum, d) => sum + d.card.value * d.p, 0));

/** Retour théorique d'un pack : part du prix récupérée en revendant aussitôt la carte. */
export const packReturn = (pack) => (expectedValue(pack) * RULES.buybackRate) / pack.price;

/** Marge théorique du site sur un pack dont la carte est revendue aussitôt. */
export const packEdge = (pack) => 1 - packReturn(pack);

const versions = new Map();

/**
 * Empreinte courte de la table de tirage. Elle change dès qu'une carte, une
 * plage de tickets ou un palier change : notée avec chaque tirage, elle permet
 * de savoir sur quelle version de la table il a été fait.
 */
export function tableVersion(pack) {
  if (!versions.has(pack.slug)) {
    const text = dropTable(pack).map((d) => `${d.card.id}:${d.from}-${d.to}`).join('|');
    versions.set(pack.slug, sha256Hex(text).slice(0, 12));
  }
  return versions.get(pack.slug);
}

/** Probabilité d'obtenir une carte valant au moins le prix du pack. */
export const profitChance = (pack) => dropTable(pack).reduce((sum, d) => sum + (d.card.value >= pack.price ? d.p : 0), 0);
