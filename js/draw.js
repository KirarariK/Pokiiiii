// Tirage d'une carte dans un pack.
//
// 1. On tire un palier selon les probabilités publiées.
// 2. On tire ensuite une carte parmi celles du palier, pondérée par
//    cardWeight() (voir RULES.tierSkew dans config.js).
//
// DÉMO : le tirage a lieu dans le navigateur. En production il doit être fait
// côté serveur, sur un inventaire réel (une carte physique = une ligne de
// stock), avec un générateur d'aléa certifié et un journal d'audit.

import { cardWeight, tierPool } from './catalog.js';
import { pickWeighted, randInt } from './rng.js';

/** Les probabilités sont exprimées en % avec une décimale : on tire en millièmes. */
const SCALE = 10;

/**
 * @param {object} pack  un pack de js/data/packs.js
 * @param {(n: number) => number} [intFn]  source d'entiers (cryptographique par défaut)
 * @returns {{ card: import('./catalog.js').Card, rarity: string, tierIndex: number }}
 */
export function drawFromPack(pack, intFn = randInt) {
  const indexes = pack.tiers.map((_, i) => i).filter((i) => tierPool(pack, i).length > 0);
  if (!indexes.length) throw new Error(`Aucune carte disponible pour le pack « ${pack.slug} »`);
  const tierIndex = pickWeighted(indexes, (i) => pack.tiers[i].p * SCALE, intFn);
  const pool = tierPool(pack, tierIndex);
  const card = pickWeighted(pool, (c) => cardWeight(c, pool), intFn);
  return { card, rarity: pack.tiers[tierIndex].rarity, tierIndex };
}
