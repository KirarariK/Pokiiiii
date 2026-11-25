// Mise en forme : montants, dates, échappement HTML.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Échappe une valeur avant insertion dans du HTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const EUR0 = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const NUM = new Intl.NumberFormat('fr-FR');

/** Montant en centimes -> « 9,95 € ». */
export const eur = (cents) => EUR.format((cents || 0) / 100);

/** Montant en centimes sans décimales quand il est rond -> « 100 € ». */
export const eurShort = (cents) => ((cents || 0) % 100 === 0 ? EUR0.format(cents / 100) : EUR.format(cents / 100));

export const num = (n) => NUM.format(n || 0);

/** Pourcentage -> « 5,5 % ». */
export const pct = (p) =>
  `${p.toLocaleString('fr-FR', { minimumFractionDigits: p % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 })} %`;

/** Probabilité (0 à 1) -> « 12,5 % », « 0,045 % » ou « 0,0019 % » : assez de décimales pour ne jamais afficher zéro. */
export function pctFine(p) {
  const v = p * 100;
  const digits = v >= 10 ? 1 : v >= 1 ? 2 : v >= 0.01 ? 3 : 4;
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
}

/** Durée écoulée -> « il y a 3 min ». */
export function ago(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return "à l'instant";
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return `le ${dateFr(ts)}`;
}

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const DATETIME = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const DAYMONTH = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const MONTHYEAR = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

export const dateFr = (ts) => DATE.format(new Date(ts));
export const dateTimeFr = (ts) => DATETIME.format(new Date(ts));
export const dayMonthFr = (ts) => DAYMONTH.format(new Date(ts));
export const monthYearFr = (ts) => MONTHYEAR.format(new Date(ts));

/** Initiales d'un pseudo pour l'avatar. */
export const initials = (pseudo) => String(pseudo || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?';

/** « 1 carte » / « 3 cartes ». */
export const plural = (n, one, many) => `${num(n)} ${n > 1 ? many : one}`;
