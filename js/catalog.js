// Cartes et tables de tirage des packs.
//
// Une table de tirage découpe 1 000 000 de tickets entre les cartes d'un pack.
// Chaque carte y occupe une plage [from, to) : sa probabilité est la taille de
// sa plage divisée par le nombre de tickets. C'est cette table, publiée sur la
// page du pack, qui fait foi : le tirage ne fait que désigner un ticket.
//
// La table n'est pas écrite à l'avance : elle est calculée sur les cartes
// réellement au coffre (js/stock.js). Elle change donc dès qu'une carte entre
// ou sort, et un pack que le coffre ne permet pas de composer n'est pas en vente.

import { RULES } from './config.js';
import { CARDS as RAW, SETS } from './data/cards.js';
import { nameFr } from './data/names-fr.js';
import { TICKETS, sha256Hex } from './fair.js';
import { drawableQty, extraCards, priceOverride, qtyOf, stockVersion } from './stock.js';

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

/**
 * Fonds de démonstration : les cartes livrées avec le site, du plus coté au
 * moins coté. Sert aussi aux contenus décoratifs (thèmes, bandeau d'accueil).
 * @type {Card[]}
 */
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

const BASE_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/* ------------------------------------------------------------------ coffre */

let known = { v: -1, extras: new Map(), vault: [], vaultById: new Map() };

/** Recalcule les listes dérivées du stock quand il a changé. */
function sync() {
  const v = stockVersion();
  if (known.v === v) return known;
  const extras = new Map(extraCards().map((c) => [c.id, c]));
  const vault = [];
  for (const card of [...CARDS, ...extras.values()]) {
    if (qtyOf(card.id) <= 0) continue;
    const price = priceOverride(card.id);
    vault.push(price != null && price !== card.value ? { ...card, value: price } : card);
  }
  vault.sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  known = { v, extras, vault, vaultById: new Map(vault.map((c) => [c.id, c])) };
  return known;
}

/** Cartes actuellement au coffre, de la plus cotée à la moins cotée. @returns {Card[]} */
export const stockCards = () => sync().vault;

/** Carte au coffre, avec la cote retenue par le site. @returns {Card|undefined} */
export const stockCard = (id) => sync().vaultById.get(id);

/** Fiche d'une carte connue du site, qu'elle soit encore au coffre ou non. @returns {Card|undefined} */
export const cardById = (id) => BASE_BY_ID.get(id) || sync().extras.get(id);

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

/** Une carte peut-elle sortir de ce pack, d'après sa cote et le thème du pack ? */
export function fitsPack(card, pack) {
  if (!matches(card, pack.filter)) return false;
  const lo = pack.tiers[0].min * 100;
  const hi = pack.tiers[pack.tiers.length - 1].max * 100 + 99;
  return card.value >= lo && card.value <= hi;
}

/* ------------------------------------------------------- tables de tirage */

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
 * @property {number} copies     exemplaires au coffre
 * @property {number} from       premier ticket (inclus)
 * @property {number} to         dernier ticket (exclu)
 * @property {number} p          probabilité, entre 0 et 1
 */

/**
 * @typedef {Object} PackTable
 * @property {boolean} ok        le pack peut être vendu
 * @property {''|'stock'|'calibrage'} reason
 * @property {string} message    ce qui manque, pour l'admin
 * @property {Array<{rarity: string, min: number, max: number, count: number, copies: number, p: number}>} tiers
 * @property {Drop[]} drops      des plus gros lots (petits tickets) aux plus petits
 * @property {number} ev         cote moyenne d'une carte tirée, en centimes
 * @property {string} version    empreinte courte de la table
 */

/** Raison géométrique entre deux paliers : bornes de la recherche. */
const R_MIN = 0.02;
const R_MAX = 2.5;

/**
 * Compose la table d'un pack à partir du coffre.
 *   1. Chaque palier reçoit les cartes au coffre dont la cote tombe dans sa fourchette.
 *   2. Les probabilités des paliers suivent une progression géométrique, dont la
 *      raison est réglée pour que le retour tombe sur la cible du pack.
 *   3. Dans un palier, le poids d'une carte vaut exemplaires × (cote plancher / cote)^skew :
 *      plus il y a d'exemplaires, plus elle sort ; plus elle est cotée, moins elle sort.
 * @returns {PackTable}
 */
function buildTable(pack) {
  const skew = pack.skew ?? RULES.tierSkew;
  const cards = sync().vault.filter((c) => matches(c, pack.filter));
  const tiers = pack.tiers.map((tier) => {
    const lo = tier.min * 100;
    const hi = tier.max * 100 + 99;
    const pool = [];
    for (const card of cards) {
      if (card.value < lo || card.value > hi) continue;
      const copies = drawableQty(card.id);
      if (copies > 0) pool.push({ card, copies });
    }
    pool.sort((a, b) => b.card.value - a.card.value || a.card.id.localeCompare(b.card.id));
    return { rarity: tier.rarity, min: tier.min, max: tier.max, pool, count: pool.length, copies: pool.reduce((s, x) => s + x.copies, 0), p: 0 };
  });
  const view = () => tiers.map(({ pool, weights, mean, ...t }) => t);
  const fail = (reason, message) => ({ ok: false, reason, message, tiers: view(), drops: [], ev: 0, version: '' });

  const live = tiers.filter((t) => t.count > 0);
  if (live.length < RULES.minTiers) {
    const empty = tiers.filter((t) => !t.count).map((t) => `${t.min}–${t.max} €`);
    return fail('stock', `Pas assez de cartes au coffre : il en faut dans au moins ${RULES.minTiers} paliers (vides : ${empty.join(', ')}).`);
  }
  for (const t of live) {
    const floor = t.pool[t.pool.length - 1].card.value;
    t.weights = t.pool.map(({ card, copies }) => copies * Math.pow(floor / card.value, skew));
    const total = t.weights.reduce((a, b) => a + b, 0);
    t.mean = t.pool.reduce((s, x, i) => s + x.card.value * t.weights[i], 0) / total;
  }

  // Raison géométrique : EV(r) croît avec r, on cherche EV(r) = prix × cible / taux de rachat.
  const goal = (pack.price * pack.target) / RULES.buybackRate;
  const ev = (r) => {
    let num = 0;
    let den = 0;
    live.forEach((t, i) => {
      const w = Math.pow(r, i);
      num += t.mean * w;
      den += w;
    });
    return num / den;
  };
  let lo = R_MIN;
  let hi = R_MAX;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (ev(mid) < goal) lo = mid;
    else hi = mid;
  }
  const r = (lo + hi) / 2;

  const tickets = allocate(live.map((_, i) => Math.pow(r, i)), TICKETS);
  if (live.some((t, i) => tickets[i] < t.count)) return fail('calibrage', 'Un palier compte plus de cartes que de tickets : retire des références ou élargis le pack.');

  const drops = [];
  let cursor = 0;
  for (let i = live.length - 1; i >= 0; i--) {
    const t = live[i];
    t.p = tickets[i] / TICKETS;
    const shares = allocate(t.weights, tickets[i]);
    t.pool.forEach(({ card, copies }, j) => {
      drops.push({ card, rarity: t.rarity, tierIndex: tiers.indexOf(t), copies, from: cursor, to: cursor + shares[j], p: shares[j] / TICKETS });
      cursor += shares[j];
    });
  }

  const mean = drops.reduce((sum, d) => sum + d.card.value * d.p, 0);
  const ret = (mean * RULES.buybackRate) / pack.price;
  if (Math.abs(ret - pack.target) > RULES.returnTolerance) {
    const message = ret > pack.target ? 'Les cartes au coffre sont trop cotées pour le prix de ce pack : ajoute des cartes dans les petits paliers.' : 'Il manque de grosses cartes au coffre pour atteindre le retour annoncé.';
    return fail('calibrage', message);
  }
  const version = sha256Hex(drops.map((d) => `${d.card.id}:${d.from}-${d.to}`).join('|')).slice(0, 12);
  return { ok: true, reason: '', message: '', tiers: view(), drops, ev: mean, version };
}

const tables = new Map();

/** Table de tirage d'un pack sur le stock du moment. @returns {PackTable} */
export function packTable(pack) {
  const v = stockVersion();
  const hit = tables.get(pack.slug);
  if (hit && hit.v === v) return hit.table;
  const table = buildTable(pack);
  tables.set(pack.slug, { v, table });
  return table;
}

/** Le coffre permet-il de vendre ce pack ? */
export const packAvailable = (pack) => packTable(pack).ok;

/** Paliers du pack avec leur probabilité du moment (0 pour un palier vide). */
export const packTiers = (pack) => packTable(pack).tiers;

/** Lots du pack, des plus gros aux plus petits (vide si le pack n'est pas en vente). @returns {Drop[]} */
export const dropTable = (pack) => packTable(pack).drops;

/** Cartes au coffre d'un palier. @returns {Card[]} */
export const tierPool = (pack, tierIndex) => dropTable(pack).filter((d) => d.tierIndex === tierIndex).map((d) => d.card);

/** Lot correspondant à un ticket (recherche dichotomique). @returns {Drop} */
export function resolveTicket(pack, ticket) {
  const table = dropTable(pack);
  if (!table.length) throw new Error(`Pack « ${pack.slug} » : aucune table de tirage, le coffre ne permet pas de le composer`);
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

/** Cote moyenne d'une carte tirée dans un pack, en centimes (0 si le pack n'est pas en vente). */
export const expectedValue = (pack) => Math.round(packTable(pack).ev);

/** Retour théorique d'un pack : part du prix récupérée en revendant aussitôt la carte. */
export const packReturn = (pack) => (packTable(pack).ev * RULES.buybackRate) / pack.price;

/** Marge théorique du site sur un pack dont la carte est revendue aussitôt. */
export const packEdge = (pack) => 1 - packReturn(pack);

/**
 * Empreinte courte de la table de tirage. Elle change dès qu'une carte, une
 * plage de tickets ou un palier change : notée avec chaque tirage, elle dit
 * sur quelle version de la table il a été fait.
 */
export const tableVersion = (pack) => packTable(pack).version;

/** Probabilité d'obtenir une carte valant au moins le prix du pack. */
export const profitChance = (pack) => dropTable(pack).reduce((sum, d) => sum + (d.card.value >= pack.price ? d.p : 0), 0);

/** Packs dont une carte peut sortir en ce moment, avec sa probabilité dans chacun. */
export function dropsOfCard(cardId, packs) {
  const out = [];
  for (const pack of packs) {
    const drop = dropTable(pack).find((d) => d.card.id === cardId);
    if (drop) out.push({ pack, p: drop.p, rarity: drop.rarity });
  }
  return out;
}
