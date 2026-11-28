// Stock du coffre : les cartes que le site possède réellement, exemplaire par exemplaire.
//
// Une carte ne peut sortir d'un pack, être visée en Évolution ou servir de lot
// que si elle est au coffre. Une carte gagnée en retire un exemplaire ; une
// carte rachetée ou perdue en Évolution le remet.
//
// Démonstration : l'inventaire vit dans le navigateur (localStorage), il n'est
// donc pas partagé entre appareils. Tant qu'aucun inventaire réel n'a été saisi,
// un stock de démonstration donne quelques exemplaires de chaque carte du fonds
// (js/data/cards.js). En production, l'inventaire fait foi côté serveur.

import { STOCK_KEY } from './config.js';
import { imgUrl } from './format.js';
import { CARDS as BASE } from './data/cards.js';
import { PUBLISHED_STOCK } from './data/stock.js';

const VERSION = 1;

/**
 * Exemplaires de démonstration d'une carte du fonds, d'après sa cote en centimes.
 * Les cartes Feu les plus cotées en ont un de plus : elles servent aussi de lots
 * au giveaway du pack événement, et un lot mis de côté ne sort plus des packs.
 */
export function demoQty(value, type) {
  const spare = type === 'Fire' && value >= 40_00 ? 1 : 0;
  if (value < 10_00) return 6;
  if (value < 25_00) return 4;
  if (value < 60_00) return 3 + spare;
  if (value < 150_00) return 2 + spare;
  return 1 + spare;
}

/** Fonds de démonstration : identifiant -> [cote, type]. */
const BASE_VALUE = new Map(BASE.map(([id, , value, , type]) => [id, [value, type]]));

/**
 * État : { demo, items }.
 *   demo  : vrai tant que le stock de démonstration s'applique aux cartes du fonds
 *   items : { [identifiant]: { q, c?, p? } }
 *           q = exemplaires, c = fiche de la carte quand elle ne vient pas du fonds,
 *           p = cote retenue par le site quand elle diffère de la cote du catalogue
 */
function fresh() {
  if (PUBLISHED_STOCK) return { v: VERSION, demo: false, items: cleanItems(PUBLISHED_STOCK.items) };
  return { v: VERSION, demo: true, items: {} };
}

/** Identifiant de carte admis : lettres, chiffres, point, tiret et souligné, rien qui puisse sortir d'un attribut HTML. */
const ID_RE = /^[A-Za-z0-9._-]{1,40}$/;

const text = (v, max = 80) => String(v ?? '').slice(0, max);

/** Fiche d'une carte hors fonds, réduite aux champs attendus : rien d'autre n'entre dans l'inventaire. */
function cleanCard(id, c) {
  if (!c || typeof c !== 'object') return null;
  return {
    id,
    name: text(c.name),
    nameEn: text(c.nameEn),
    setId: text(c.setId, 24),
    set: text(c.set),
    code: text(c.code, 24),
    number: text(c.number, 16),
    value: Math.max(0, Math.round(Number(c.value)) || 0),
    type: text(c.type, 24),
    tcgRarity: text(c.tcgRarity, 40),
    img: imgUrl(c.img),
    imgHi: imgUrl(c.imgHi),
  };
}

/** Lignes d'inventaire venues d'un fichier : quantités bornées, fiches nettoyées, entrées inconnues écartées. */
function cleanItems(raw) {
  const items = {};
  if (!raw || typeof raw !== 'object') return items;
  for (const [id, item] of Object.entries(raw)) {
    if (!ID_RE.test(id) || !item || typeof item !== 'object') continue;
    const c = cleanCard(id, item.c);
    if (!BASE_VALUE.has(id) && !c) continue;
    const q = Math.max(0, Math.min(999, Math.round(item.q) || 0));
    items[id] = { q, ...(c ? { c } : {}), ...(Number.isFinite(item.p) ? { p: Math.max(1, Math.round(item.p)) } : {}) };
  }
  return items;
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STOCK_KEY));
    if (data && data.v === VERSION && data.items && typeof data.items === 'object') return { v: VERSION, demo: Boolean(data.demo), items: cleanItems(data.items) };
  } catch {
    // Pas de stockage (navigation privée, exécution hors navigateur) : état par défaut.
  }
  return fresh();
}

let state = load();
let version = 1;
const listeners = new Set();
/** Exemplaires mis de côté (lots de giveaway) : étiquette -> Map(identifiant -> nombre). */
const reserved = new Map();

function changed({ persist = true } = {}) {
  version += 1;
  if (persist) {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(state));
    } catch {
      // Stockage indisponible : l'inventaire reste en mémoire.
    }
  }
  [...listeners].forEach((fn) => fn());
}

// Un autre onglet a modifié l'inventaire : on le relit au lieu de l'écraser.
globalThis.addEventListener?.('storage', (e) => {
  if (e.key !== STOCK_KEY || e.newValue == null) return;
  state = load();
  changed({ persist: false });
});

/** Compteur qui avance à chaque changement du stock : sert de clé de cache aux tables de tirage. */
export const stockVersion = () => version;

export function subscribeStock(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Vrai tant que le stock de démonstration s'applique. */
export const usingDemoStock = () => state.demo;

/** Exemplaires au coffre. */
export function qtyOf(id) {
  const item = state.items[id];
  if (item) return item.q;
  return state.demo && BASE_VALUE.has(id) ? demoQty(...BASE_VALUE.get(id)) : 0;
}

/** Exemplaires mis de côté pour un lot. */
export function reservedOf(id) {
  let n = 0;
  for (const map of reserved.values()) n += map.get(id) || 0;
  return n;
}

/** Exemplaires qui peuvent sortir d'un pack ou être visés en Évolution. */
export const drawableQty = (id) => Math.max(0, qtyOf(id) - reservedOf(id));

/** Cote retenue par le site pour cette carte, ou null si c'est celle du catalogue. */
export const priceOverride = (id) => state.items[id]?.p ?? null;

/** Fiches des cartes ajoutées depuis le catalogue complet (hors fonds de démonstration). */
export const extraCards = () => Object.values(state.items).filter((item) => item.c).map((item) => item.c);

/** Identifiants explicitement suivis (pour l'export et les tableaux). */
export const trackedIds = () => Object.keys(state.items);

/**
 * Fixe le nombre d'exemplaires d'une carte (0 : elle n'est pas au coffre).
 * @param {string} id
 * @param {number} qty
 * @param {object} [card]  fiche complète, obligatoire la première fois pour une carte hors fonds
 */
export function setStock(id, qty, card) {
  const q = Math.max(0, Math.min(999, Math.round(qty) || 0));
  const item = state.items[id] || {};
  if (!BASE_VALUE.has(id) && !item.c && !card) return false;
  state.items[id] = { ...item, q, ...(!BASE_VALUE.has(id) && !item.c ? { c: card } : {}) };
  changed();
  return true;
}

/** Fixe en lot : [{ id, qty, card? }]. Une seule notification à la fin. */
export function setStockMany(rows) {
  let n = 0;
  for (const { id, qty, card } of rows) {
    const q = Math.max(0, Math.min(999, Math.round(qty) || 0));
    const item = state.items[id] || {};
    if (!BASE_VALUE.has(id) && !item.c && !card) continue;
    state.items[id] = { ...item, q, ...(!BASE_VALUE.has(id) && !item.c ? { c: card } : {}) };
    n++;
  }
  if (n) changed();
  return n;
}

/** Cote retenue par le site (centimes), ou null pour revenir à celle du catalogue. */
export function setPrice(id, cents) {
  const item = state.items[id] || { q: qtyOf(id) };
  if (cents == null) delete item.p;
  else item.p = Math.max(1, Math.round(cents));
  state.items[id] = item;
  changed();
}

/**
 * Mouvement de jeu : −1 quand une carte est gagnée, +1 quand elle revient au coffre.
 * @returns {boolean} faux si le coffre n'a plus d'exemplaire à sortir
 */
export function adjustStock(id, delta) {
  const now = qtyOf(id);
  if (delta < 0 && now + delta < 0) return false;
  state.items[id] = { ...(state.items[id] || {}), q: now + delta };
  changed();
  return true;
}

/** Met de côté des exemplaires sous une étiquette (remplace la réservation précédente). */
export function setReserved(tag, ids) {
  const next = new Map();
  for (const id of ids) next.set(id, (next.get(id) || 0) + 1);
  const prev = reserved.get(tag);
  const same = prev && prev.size === next.size && [...next].every(([id, n]) => prev.get(id) === n);
  if (same) return;
  if (next.size) reserved.set(tag, next);
  else reserved.delete(tag);
  changed({ persist: false });
}

/** Vide le coffre : plus aucune carte en stock (les fiches restent, pour les cartes déjà gagnées). */
export function clearStock() {
  const items = {};
  for (const [id, item] of Object.entries(state.items)) if (item.c) items[id] = { q: 0, c: item.c };
  state = { v: VERSION, demo: false, items };
  changed();
}

/** Revient au stock de départ : l'inventaire publié s'il existe, sinon le stock de démonstration. */
export function resetStock() {
  state = fresh();
  changed();
}

/** Inventaire sous forme de fichier : tout ce qui est au coffre, avec la fiche des cartes hors fonds. */
export function exportStock() {
  const items = {};
  if (state.demo) for (const [id, [value, type]] of BASE_VALUE) items[id] = { q: demoQty(value, type) };
  for (const [id, item] of Object.entries(state.items)) items[id] = { q: item.q, ...(item.c ? { c: item.c } : {}), ...(item.p != null ? { p: item.p } : {}) };
  for (const id of Object.keys(items)) if (!items[id].q && !items[id].c) delete items[id];
  return { format: 'coffreo-stock', version: VERSION, date: new Date().toISOString().slice(0, 10), items };
}

/** Remplace l'inventaire par le contenu d'un fichier exporté. @returns {number} références au coffre */
export function importStock(data) {
  if (!data || data.format !== 'coffreo-stock' || !data.items || typeof data.items !== 'object') throw new Error("Ce fichier n'est pas un inventaire exporté par le site.");
  const items = cleanItems(data.items);
  state = { v: VERSION, demo: false, items };
  changed();
  return Object.values(items).filter((item) => item.q > 0).length;
}
