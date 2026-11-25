// Catalogue de cartes : met en forme les données brutes de js/data/cards.js
// et fournit les sélections utilisées par les packs.

import { RULES } from './config.js';
import { CARDS as RAW, SETS } from './data/cards.js';
import { nameFr } from './data/names-fr.js';

const IMG = 'https://images.pokemontcg.io';

/**
 * @typedef {Object} Card
 * @property {string} id       identifiant API (ex. « sv3pt5-199 »)
 * @property {string} name     nom affiché (français quand il est connu)
 * @property {string} nameEn   nom imprimé sur la carte
 * @property {string} set      nom de l'extension
 * @property {string} code     code de l'extension (ex. « MEW »)
 * @property {string} number   numéro dans l'extension
 * @property {number} value    cote indicative, en centimes
 * @property {string} type     type principal (anglais, tel que fourni par l'API)
 * @property {string} tcgRarity rareté imprimée
 * @property {string} img      image basse définition
 * @property {string} imgHi    image haute définition
 */

/** @type {Card[]} */
export const CARDS = RAW.map(([id, nameEn, value, tcgRarity, type]) => {
  const cut = id.lastIndexOf('-');
  const setId = id.slice(0, cut);
  const number = id.slice(cut + 1);
  const set = SETS[setId] || { name: setId, code: setId.toUpperCase() };
  return {
    id,
    name: nameFr(nameEn),
    nameEn,
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

/** Cartes dont la cote tombe dans [minEuro, maxEuro] (bornes incluses, à l'euro près). */
export function cardsInRange(minEuro, maxEuro, types) {
  const lo = minEuro * 100;
  const hi = maxEuro * 100 + 99;
  return CARDS.filter((c) => c.value >= lo && c.value <= hi && (!types || types.includes(c.type)));
}

/** Nombre minimal de cartes thématiques pour qu'un palier reste varié. */
const MIN_THEMED = 3;

const poolCache = new Map();

/**
 * Cartes pouvant sortir d'un palier donné d'un pack.
 * Un pack thématique (pack.types) retombe sur le catalogue complet quand un
 * palier ne compte pas assez de cartes du thème.
 * @returns {Card[]}
 */
export function tierPool(pack, tierIndex) {
  const key = `${pack.slug}:${tierIndex}`;
  if (poolCache.has(key)) return poolCache.get(key);
  const tier = pack.tiers[tierIndex];
  let pool = pack.types ? cardsInRange(tier.min, tier.max, pack.types) : [];
  if (pool.length < MIN_THEMED) pool = cardsInRange(tier.min, tier.max);
  poolCache.set(key, pool);
  return pool;
}

/** Toutes les cartes pouvant sortir d'un pack, de la plus cotée à la moins cotée. */
export function packPool(pack) {
  const seen = new Set();
  const out = [];
  pack.tiers.forEach((_, i) => {
    for (const c of tierPool(pack, i)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
  });
  return out.sort((a, b) => b.value - a.value);
}

/** Les plus grosses cartes d'un pack, avec la rareté du palier dont elles relèvent. */
export function topHits(pack, n = 10) {
  return packPool(pack)
    .slice(0, n)
    .map((card) => ({ card, rarity: rarityInPack(pack, card) }));
}

/** Rareté affichée d'une carte dans un pack : celle du palier qui contient sa cote. */
export function rarityInPack(pack, card) {
  const euros = Math.floor(card.value / 100);
  const tier = pack.tiers.find((t) => euros >= t.min && euros <= t.max);
  return tier ? tier.rarity : 'commune';
}

/**
 * Poids de tirage d'une carte à l'intérieur de son palier (entier >= 1).
 * Avec RULES.tierSkew = 0, toutes les cartes d'un palier se valent ; avec 1,
 * la probabilité est inversement proportionnelle à la cote : les cartes les
 * moins chères sortent plus souvent, comme dans un stock réel.
 */
export function cardWeight(card, pool) {
  if (!RULES.tierSkew) return 1;
  const floor = pool.reduce((m, c) => Math.min(m, c.value), Infinity);
  return Math.max(1, Math.round(1e6 * Math.pow(floor / card.value, RULES.tierSkew)));
}

/** Cote moyenne d'une carte tirée dans un palier, en centimes. */
export function tierMean(pack, tierIndex) {
  const pool = tierPool(pack, tierIndex);
  if (!pool.length) return 0;
  const weights = pool.map((c) => cardWeight(c, pool));
  const total = weights.reduce((a, b) => a + b, 0);
  return pool.reduce((sum, c, i) => sum + c.value * weights[i], 0) / total;
}

/**
 * Cote moyenne attendue d'une carte tirée dans un pack, en centimes : moyenne
 * des paliers pondérée par leur probabilité.
 */
export function expectedValue(pack) {
  return Math.round(pack.tiers.reduce((sum, tier, i) => sum + (tier.p / 100) * tierMean(pack, i), 0));
}
