// Tirage « libre » d'une carte dans un pack, pour les contenus simulés
// (flux d'activité, bandes de la roulette) et les contrôles.
//
// Les tirages réels du joueur ne passent pas par ici : ils utilisent le ticket
// vérifiable calculé dans js/store.js à partir des graines (voir js/fair.js).

import { resolveTicket } from './catalog.js';
import { TICKETS } from './fair.js';
import { randInt } from './rng.js';

/**
 * @param {object} pack  un pack de js/data/packs.js
 * @param {(n: number) => number} [intFn]  source d'entiers (cryptographique par défaut)
 * @returns {import('./catalog.js').Drop}
 */
export function drawFromPack(pack, intFn = randInt) {
  return resolveTicket(pack, intFn(TICKETS));
}
