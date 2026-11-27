// Giveaways de la démonstration.
// Les dates sont calculées par rapport au mois en cours pour qu'il y ait
// toujours un giveaway actif et un giveaway terminé à montrer. Les lots sont
// pris dans le catalogue (cartes réelles, cotes indicatives).

import { CARDS } from '../catalog.js';
import { qtyOf, setReserved } from '../stock.js';
import { packBySlug } from './packs.js';

const startOfMonth = (d, shift = 0) => new Date(d.getFullYear(), d.getMonth() + shift, 1).getTime();

/**
 * Lots d'un giveaway : les cartes les plus cotées d'un type.
 * `inVault` ne garde que celles que le site possède encore (giveaway en cours) ;
 * un giveaway passé garde ses lots tels qu'ils ont été attribués.
 */
function lotsOf(type, count, minValue, inVault, maxValue = Infinity) {
  return CARDS.filter((c) => c.type === type && c.value >= minValue && c.value <= maxValue && (!inVault || qtyOf(c.id) > 0))
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
  const list = buildGiveaways(now);
  // Un exemplaire de chaque lot en jeu est mis de côté : il ne peut plus sortir d'un pack.
  setReserved('giveaways', list.filter((g) => now >= g.start && now <= g.end).flatMap((g) => g.lots.map((c) => c.id)));
  return list;
}

function buildGiveaways(now) {
  const d = new Date(now);
  const withTotal = (g) => ({ ...g, total: g.lots.reduce((s, c) => s + c.value, 0) });
  const endOfMonth = startOfMonth(d, 1) - 1000;
  return [
    withTotal({
      id: 'brasier',
      title: 'Giveaway Brasier',
      intro: "Jusqu'à sept cartes de type Feu à gagner. Un lot n'est tiré au sort que s'il est débloqué à la clôture. Chaque Pack Brasier ouvert pendant le mois donne un ticket.",
      pack: 'brasier',
      start: startOfMonth(d),
      end: endOfMonth,
      drawAt: startOfMonth(d, 1) + 3 * 86400_000 + 18.5 * 3600_000,
      // Lots dimensionnés sur les ventes attendues du pack : la cagnotte d'un mois peut tous les débloquer.
      lots: lotsOf('Fire', 7, 40_00, true, 220_00),
      /** Part du prix de chaque pack vendu versée à la cagnotte : les lots se débloquent au fil des ventes. */
      fundRate: 0.05,
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
      lots: lotsOf('Psychic', 6, 40_00, false),
    }),
  ];
}

export const giveawayById = (id, now = Date.now()) => listGiveaways(now).find((g) => g.id === id) || null;

export const isActive = (g, now = Date.now()) => now >= g.start && now <= g.end;

/**
 * Cagnotte d'un giveaway financé par les ventes de son pack.
 * Chaque pack vendu y verse une part de son prix ; les lots se débloquent du
 * moins coté au plus coté. Le site n'offre donc jamais plus que ce que le pack
 * a déjà rapporté. Un giveaway sans financement (fundRate absent) est entièrement
 * débloqué.
 * @param {Giveaway} g
 * @param {number} tickets  packs vendus à ce jour
 */
export function giveawayPool(g, tickets) {
  const pack = g.pack ? packBySlug(g.pack) : null;
  if (!pack || !g.fundRate) return { funded: false, tickets, pool: g.total, perTicket: 0, unlocked: g.lots.length, next: null, need: new Map() };
  const perTicket = pack.price * g.fundRate;
  const need = new Map();
  let cumulative = 0;
  for (const card of [...g.lots].sort((a, b) => a.value - b.value)) {
    cumulative += card.value;
    need.set(card.id, Math.ceil(cumulative / perTicket));
  }
  const lockedLots = g.lots.filter((c) => need.get(c.id) > tickets).sort((a, b) => need.get(a.id) - need.get(b.id));
  return {
    funded: true,
    tickets,
    pool: Math.min(g.total, Math.floor(tickets * perTicket)),
    perTicket,
    unlocked: g.lots.length - lockedLots.length,
    /** Prochain lot à débloquer et nombre de packs encore nécessaires. */
    next: lockedLots.length ? { card: lockedLots[0], missing: need.get(lockedLots[0].id) - tickets } : null,
    need,
  };
}
