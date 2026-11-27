// Modèle économique vu du site : du prix d'un pack au résultat, ligne par ligne,
// et simulation d'un mois d'activité.
//
// Trois issues pour chaque carte tirée, de cote V :
//   - revendue pendant la garantie : le site reverse buybackRate × V et garde la carte ;
//   - revendue plus tard           : le site reverse buybackLaterRate × V et garde la carte ;
//   - gardée ou livrée             : le site se sépare d'une carte qui lui a coûté cost × V.
//
// Du chiffre d'affaires au résultat :
//     ventes − coût des cartes                                   = marge de jeu
//   − cashback − dotation du classement − giveaway − bonus       = marge après fidélité
//   − frais de paiement et fraude − TVA sur la marge             = résultat avant frais fixes
//   − frais fixes (équipe, coffre, assurance, outils, publicité) = résultat du mois
// Reste hors modèle : l'impôt sur les sociétés.
// L'Évolution n'y figure pas non plus : elle ne déplace pas d'argent, seulement des cartes.

import { RULES } from './config.js';
import { dropTable, expectedValue, packAvailable, packEdge, packReturn, resolveTicket, tableVersion } from './catalog.js';
import { giveawayById } from './data/giveaways.js';
import { PACKS } from './data/packs.js';
import { TICKETS } from './fair.js';
import { seeded } from './rng.js';

/** Hypothèse de travail : part de chaque pack dans le nombre de packs vendus. */
export const SALES_MIX = { rosee: 0.34, prisme: 0.12, orage: 0.2, millesime: 0.08, brasier: 0.1, canopee: 0.1, zenith: 0.045, joyau: 0.015 };

/**
 * Hypothèses par défaut du simulateur.
 *   packs        packs vendus par mois
 *   rtpShift     écart de retour par rapport aux tables publiées (0,01 = un point de retour en moins)
 *   instant      part des cartes revendues pendant la garantie
 *   later        part des cartes revendues plus tard
 *   cost         prix d'achat des cartes, en part de leur cote
 *   cashbackRate part de la marge théorique rendue en cashback (moyenne des badges)
 *   fees         frais de paiement et fraude, en part des dépôts
 *   newPer100    nouveaux déposants pour 100 packs vendus (chacun touche le bonus de premier dépôt)
 *   fixed        frais fixes du mois, en centimes : équipe, coffre, assurance, outils, publicité
 *   vat          régime de TVA : 0 aucune ; 1 sur la marge, calculée globalement sur le mois (lecture la
 *                plus favorable) ; 2 sur la marge, vente par vente (méthode par défaut du régime) ;
 *                3 sur tout le prix. Le régime réellement applicable est à faire valider (docs/AUDIT_JURIDIQUE.md).
 */
export const DEFAULTS = { packs: 5000, rtpShift: 0, instant: 0.65, later: 0.1, cost: 0.75, cashbackRate: 0.06, fees: 0.03, newPer100: 4, fixed: 6000_00, vat: 1 };

/** Premier dépôt moyen retenu pour chiffrer le bonus (hypothèse). */
export const AVERAGE_FIRST_DEPOSIT = 60_00;

/** TVA au taux normal : 20 % hors taxe, soit 20/120 de la base toutes taxes comprises. */
export const VAT_ON_MARGIN = 20 / 120;

/** Régimes de TVA du simulateur, du plus favorable au plus lourd. */
export const VAT_REGIMES = [
  [1, 'Marge, calcul global du mois'],
  [2, 'Marge, vente par vente'],
  [3, 'Sur tout le prix'],
  [0, 'Aucune'],
];

const kept = (h) => Math.max(0, 1 - h.instant - h.later);

/** Part de la cote créditée au solde des joueurs par les rachats, en moyenne. */
const creditShare = (h) => h.instant * RULES.buybackRate + h.later * RULES.buybackLaterRate;

/** Coût moyen d'une carte pour le site, en part de sa cote, selon ce que les joueurs en font. */
const cardCost = (h) => creditShare(h) + kept(h) * h.cost;

/** Facteur appliqué aux cotes d'un pack pour simuler un retour plus bas ou plus haut que celui publié. */
const valueScale = (pack, h) => Math.max(0, 1 - (h.rtpShift || 0) / packReturn(pack));

const fundRates = new Map();
/** Part du prix d'un pack versée à la cagnotte de son giveaway (0 pour un pack sans événement). */
function fundRate(pack) {
  if (!fundRates.has(pack.slug)) fundRates.set(pack.slug, (pack.giveaway && giveawayById(pack.giveaway)?.fundRate) || 0);
  return fundRates.get(pack.slug);
}

const shortfalls = new Map();
/**
 * Argent frais que demande un pack quand sa carte est rachetée à `rate` fois sa
 * cote : en moyenne, max(0, prix − rachat). Calcul exact sur la table de tirage.
 */
function shortfall(pack, rate) {
  const key = `${pack.slug}:${tableVersion(pack)}:${rate.toFixed(6)}`;
  if (!shortfalls.has(key)) shortfalls.set(key, dropTable(pack).reduce((sum, d) => sum + d.p * Math.max(0, pack.price - rate * d.card.value), 0));
  return shortfalls.get(key);
}

/** Dépôt moyen derrière un pack vendu : son prix, moins ce que le rachat de la carte remet en jeu. */
function depositPerPack(pack, h) {
  const scale = valueScale(pack, h);
  return kept(h) * pack.price + h.instant * shortfall(pack, RULES.buybackRate * scale) + h.later * shortfall(pack, RULES.buybackLaterRate * scale);
}

/**
 * Marge taxable moyenne d'un pack quand elle se calcule vente par vente : une vente à perte
 * (carte qui a coûté plus que le prix du pack) ne vient en déduction d'aucune autre.
 */
function perSaleMargin(pack, h) {
  const scale = valueScale(pack, h);
  return h.instant * shortfall(pack, RULES.buybackRate * scale) + h.later * shortfall(pack, RULES.buybackLaterRate * scale) + kept(h) * shortfall(pack, h.cost * scale);
}

/** TVA d'un pack vendu selon le régime retenu (centimes). */
function vatPerPack(pack, h, gross) {
  if (!h.vat) return 0;
  if (h.vat === 3) return pack.price * VAT_ON_MARGIN;
  if (h.vat === 2) return perSaleMargin(pack, h) * VAT_ON_MARGIN;
  return Math.max(0, gross) * VAT_ON_MARGIN;
}

/** Packs que le coffre permet de vendre en ce moment. */
export const sellablePacks = () => PACKS.filter(packAvailable);

/** Marge moyenne des packs en vente, pondérée par les ventes (hypothèse SALES_MIX). */
export function blendedEdge() {
  let revenue = 0;
  let theo = 0;
  for (const pack of sellablePacks()) {
    const sales = (SALES_MIX[pack.slug] || 0) * pack.price;
    revenue += sales;
    theo += sales * packEdge(pack);
  }
  return revenue ? theo / revenue : 0;
}

/** Bonus de premier dépôt versé à un nouveau déposant moyen, en centimes. */
export const averageBonus = () => Math.min(RULES.bonus.firstDepositMax, AVERAGE_FIRST_DEPOSIT * RULES.bonus.firstDepositRate);

/** Coût mensuel du bonus de premier dépôt : un bonus par nouveau déposant, supposé joué jusqu'au bout. */
export const firstDepositBonus = (h) => (h.packs / 100) * h.newPer100 * averageBonus();

/**
 * Résultat attendu d'un pack vendu, ligne par ligne, en centimes.
 * Le bonus de premier dépôt n'y figure pas : il se compte par joueur, pas par pack.
 */
export function packEconomics(pack, h) {
  const { price } = pack;
  const ev = expectedValue(pack) * valueScale(pack, h);
  const theo = price * (packEdge(pack) + (h.rtpShift || 0));
  const cards = ev * cardCost(h);
  const gross = price - cards;
  const cashback = theo * h.cashbackRate;
  const leaderboard = theo * RULES.leaderboardShare;
  const giveaway = price * fundRate(pack) * cardCost(h);
  const fees = depositPerPack(pack, h) * h.fees;
  const vat = vatPerPack(pack, h, gross);
  const net = gross - cashback - leaderboard - giveaway - fees - vat;
  return { price, theo, cards, gross, cashback, leaderboard, giveaway, fees, vat, net, rate: net / price, grossRate: gross / price };
}

/** Compte de résultat attendu d'un mois, par le calcul (sans tirage). */
export function expectedMonth(h) {
  const sum = { revenue: 0, cards: 0, gross: 0, cashback: 0, leaderboard: 0, giveaway: 0, fees: 0 };
  let vatBySale = 0;
  for (const pack of sellablePacks()) {
    const sold = h.packs * (SALES_MIX[pack.slug] || 0);
    const e = packEconomics(pack, h);
    sum.revenue += sold * e.price;
    sum.cards += sold * e.cards;
    sum.gross += sold * e.gross;
    sum.cashback += sold * e.cashback;
    sum.leaderboard += sold * e.leaderboard;
    sum.giveaway += sold * e.giveaway;
    sum.fees += sold * e.fees;
    vatBySale += sold * e.vat;
  }
  const bonus = firstDepositBonus(h);
  const loyalty = sum.cashback + sum.leaderboard + sum.giveaway + bonus;
  // Marge globale : les ventes à perte du mois compensent les autres. Sinon, la TVA se somme vente par vente.
  const vat = h.vat === 1 || h.vat === true ? Math.max(0, sum.gross) * VAT_ON_MARGIN : vatBySale;
  const contribution = sum.gross - loyalty - sum.fees - vat;
  const result = contribution - h.fixed;
  // Tout est proportionnel au nombre de packs, sauf les frais fixes : le seuil s'en déduit.
  const perPack = h.packs ? contribution / h.packs : 0;
  return {
    ...sum,
    bonus,
    loyalty,
    afterLoyalty: sum.gross - loyalty,
    vat,
    contribution,
    fixed: h.fixed,
    result,
    rate: sum.revenue ? result / sum.revenue : 0,
    breakEven: perPack > 0 ? Math.ceil(h.fixed / perPack) : Infinity,
  };
}

/**
 * Leviers : ce que change, sur le résultat du mois, un petit mouvement de chaque
 * hypothèse, toutes choses égales par ailleurs. Triés du plus rentable au moins rentable.
 */
export function levers(h) {
  const base = expectedMonth(h).result;
  const gain = (patch) => expectedMonth({ ...h, ...patch }).result - base;
  return [
    { key: 'cost', label: 'Acheter les cartes 5 points moins cher', gain: gain({ cost: h.cost - 0.05 }) },
    { key: 'rtp', label: 'Un point de retour en moins sur tous les packs', gain: gain({ rtpShift: (h.rtpShift || 0) + 0.01 }) },
    { key: 'kept', label: '5 points de cartes gardées en plus, plutôt que revendues aussitôt', gain: gain({ instant: Math.max(0, h.instant - 0.05) }) },
    { key: 'packs', label: '10 % de packs vendus en plus', gain: gain({ packs: h.packs * 1.1 }) },
    { key: 'fees', label: 'Un point de frais de paiement en moins', gain: gain({ fees: Math.max(0, h.fees - 0.01) }) },
    { key: 'cashback', label: 'Un point de cashback moyen en moins', gain: gain({ cashbackRate: Math.max(0, h.cashbackRate - 0.01) }) },
  ].sort((a, b) => b.gain - a.gain);
}

/**
 * Simule `runs` mois de `packs` ventes chacun et rend la dispersion du résultat.
 * Le générateur est à graine : mêmes hypothèses, mêmes chiffres.
 */
export function simulateMonths(h, { runs = 200, seed = 'pilotage' } = {}) {
  const next = seeded(`${seed}:${h.packs}:${h.instant}:${h.later}`);
  const mix = [];
  let cumulative = 0;
  for (const pack of sellablePacks()) {
    cumulative += SALES_MIX[pack.slug] || 0;
    const e = packEconomics(pack, h);
    mix.push({ pack, upTo: cumulative, scale: valueScale(pack, h), fixed: e.cashback + e.leaderboard + e.giveaway });
  }
  const total = cumulative;
  if (!mix.length) return { runs, revenue: 0, mean: -h.fixed, low: -h.fixed, median: -h.fixed, high: -h.fixed, lossRisk: 1, results: new Array(runs).fill(-h.fixed) };
  const sold = h.instant + h.later;
  const bonus = firstDepositBonus(h);
  const results = [];
  let revenue = 0;
  for (let r = 0; r < runs; r++) {
    let gross = 0;
    let other = 0;
    let margins = 0;
    for (let i = 0; i < h.packs; i++) {
      const pick = next() * total;
      const { pack, scale, fixed } = mix.find((m) => pick < m.upTo) || mix[mix.length - 1];
      const value = resolveTicket(pack, Math.floor(next() * TICKETS)).card.value * scale;
      const u = next();
      const cost = value * (u < h.instant ? RULES.buybackRate : u < sold ? RULES.buybackLaterRate : h.cost);
      gross += pack.price - cost;
      margins += Math.max(0, pack.price - cost);
      // Un rachat remet de l'argent en jeu : seul le reste a dû être déposé, et supporte les frais.
      other += fixed + Math.max(0, pack.price - (u < sold ? cost : 0)) * h.fees;
      revenue += pack.price;
    }
    const vat = !h.vat ? 0 : h.vat === 2 ? margins * VAT_ON_MARGIN : h.vat === 3 ? revenue * VAT_ON_MARGIN : Math.max(0, gross) * VAT_ON_MARGIN;
    results.push(gross - other - bonus - vat - h.fixed);
  }
  results.sort((a, b) => a - b);
  const at = (q) => results[Math.min(results.length - 1, Math.floor(q * results.length))];
  return {
    runs,
    revenue: revenue / runs,
    mean: results.reduce((a, b) => a + b, 0) / runs,
    low: at(0.05),
    median: at(0.5),
    high: at(0.95),
    lossRisk: results.filter((x) => x < 0).length / runs,
    results,
  };
}
