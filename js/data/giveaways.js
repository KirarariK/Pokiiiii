// Giveaways de la démonstration.
// Les dates sont calculées par rapport au mois en cours pour qu'il y ait
// toujours un giveaway actif et un giveaway terminé à montrer. Les lots sont
// pris dans le catalogue (cartes réelles, cotes indicatives).

import { CARDS } from '../catalog.js';

const startOfMonth = (d, shift = 0) => new Date(d.getFullYear(), d.getMonth() + shift, 1).getTime();

function lotsOf(type, count, minValue) {
  return CARDS.filter((c) => c.type === type && c.value >= minValue)
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

/**
 * @typedef {Object} Giveaway
 * @property {string} id
 * @property {string} title
 * @property {string} intro
 * @property {string|null} pack   pack dont l'ouverture donne des tickets
 * @property {number} start
 * @property {number} end
 * @property {number} drawAt     tirage au sort
 * @property {import('../catalog.js').Card[]} lots  du plus coté au moins coté
 * @property {number} total      valeur totale des lots, en centimes
 * @property {boolean} [hot]
 */

/** @returns {Giveaway[]} giveaways, les actifs d'abord */
export function listGiveaways(now = Date.now()) {
  const d = new Date(now);
  const withTotal = (g) => ({ ...g, total: g.lots.reduce((s, c) => s + c.value, 0) });
  const endOfMonth = startOfMonth(d, 1) - 1000;
  return [
    withTotal({
      id: 'brasier',
      title: 'Giveaway Brasier',
      intro: 'Douze cartes de type Feu à gagner, douze gagnants. Chaque Pack Brasier ouvert pendant le mois donne un ticket.',
      pack: 'brasier',
      start: startOfMonth(d),
      end: endOfMonth,
      drawAt: startOfMonth(d, 1) + 3 * 86400_000 + 18.5 * 3600_000,
      lots: lotsOf('Fire', 12, 40_00),
      hot: true,
    }),
    withTotal({
      id: 'aurore',
      title: 'Giveaway Aurore',
      intro: 'Six cartes de type Psy tirées au sort parmi les participants du mois dernier.',
      pack: null,
      start: startOfMonth(d, -1),
      end: startOfMonth(d) - 1000,
      drawAt: startOfMonth(d) + 3 * 86400_000 + 18.5 * 3600_000,
      lots: lotsOf('Psychic', 6, 40_00),
    }),
  ];
}

export const giveawayById = (id, now = Date.now()) => listGiveaways(now).find((g) => g.id === id) || null;

export const isActive = (g, now = Date.now()) => now >= g.start && now <= g.end;
