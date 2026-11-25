// État du compte démo, conservé dans le navigateur (localStorage).
//
// Tout ce module est une maquette de back-office : solde, coffre, tirages,
// rachats et livraisons sont simulés localement. En production, chaque action
// ci-dessous devient un appel à une API authentifiée et l'état fait foi côté
// serveur (en particulier la graine serveur, qui ne doit jamais être lisible).

import { RULES, STORAGE_KEY } from './config.js';
import { cardById, resolveTicket } from './catalog.js';
import { progress } from './data/badges.js';
import { packBySlug, rarityByValue } from './data/packs.js';
import { TICKETS, isValidClientSeed, newClientSeed, newServerSeed, sha256Hex, ticketFor } from './fair.js';
import { uid } from './rng.js';

const VERSION = 2;
const MAX_TX = 500;
const MAX_ROLLS = 300;
const MAX_ARCHIVE = 20;

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const dayKey = (d = new Date()) => `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;

function freshSeeds(clientSeed = newClientSeed()) {
  const serverSeed = newServerSeed();
  return { serverSeed, serverHash: sha256Hex(serverSeed), clientSeed, nonce: 0, since: Date.now() };
}

function fresh() {
  return {
    v: VERSION,
    user: null, // { pseudo, since }
    session: false,
    balance: 0, // centimes
    cards: [], // cartes obtenues (voir buyPacks et evolve)
    pending: [], // uid des cartes achetées mais pas encore révélées
    lastOrder: null,
    tx: [],
    shipments: [],
    points: { month: monthKey(), monthly: 0, total: 0 },
    xp: 0,
    daily: { lastDay: '', streak: 0 },
    giveaways: {}, // { [id]: { joined, followed, tickets } }
    limits: { daily: null, pauseUntil: 0 },
    settings: { sound: true, motion: true, fast: false, realityCheck: 30 },
    fair: { ...freshSeeds(), archive: [] },
    rolls: [], // journal des tirages (voir logRoll)
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    if (!data || data.v !== VERSION || !data.fair?.serverSeed) return fresh();
    const base = fresh();
    return {
      ...base,
      ...data,
      points: { ...base.points, ...data.points },
      daily: { ...base.daily, ...data.daily },
      limits: { ...base.limits, ...data.limits },
      settings: { ...base.settings, ...data.settings },
    };
  } catch {
    return fresh();
  }
}

let state = load();
const listeners = new Set();

function commit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la session reste en mémoire.
  }
  // Copie : un abonné peut se désabonner ou en ajouter un autre pendant la notification.
  [...listeners].forEach((fn) => fn(state));
}

export const getState = () => state;

/** S'abonne aux changements d'état. Retourne la fonction de désabonnement. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const fail = (code, message) => ({ ok: false, code, message });

/* ------------------------------------------------------------------ lecture */

export const isLoggedIn = () => Boolean(state.user && state.session);

/** Cartes actuellement au coffre, de la plus récente à la plus ancienne. */
export const vaultCards = () => state.cards.filter((c) => c.status === 'coffre').sort((a, b) => b.at - a.at);

export const ownedByUid = (id) => state.cards.find((c) => c.uid === id) || null;

/** Montant crédité si la carte est revendue maintenant, en centimes. */
export const buybackOf = (owned) => Math.round(owned.value * RULES.buybackRate);

/** Dépenses en packs depuis un instant donné, en centimes. */
const spentSince = (ts) => state.tx.filter((t) => t.type === 'achat' && t.at >= ts).reduce((sum, t) => sum - t.amount, 0);

/** Dépenses en packs depuis minuit (heure locale), en centimes. */
export function spentToday(now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return spentSince(midnight.getTime());
}

/** Bilan depuis un instant donné (rappel de session) : dépensé, reçu en reventes, net. */
export function activitySince(ts) {
  const spent = spentSince(ts);
  const received = state.tx.filter((t) => t.type === 'rachat' && t.at >= ts).reduce((sum, t) => sum + t.amount, 0);
  return { spent, received, net: received - spent };
}

export function shippingFee(zone, count) {
  const z = RULES.shipping[zone];
  if (!z || count <= 0) return 0;
  return z.base + z.perExtraCard * (count - 1);
}

/** Chiffres clés du profil. */
export function stats() {
  const spent = state.tx.filter((t) => t.type === 'achat').reduce((s, t) => s - t.amount, 0);
  const received = state.tx.filter((t) => t.type === 'rachat').reduce((s, t) => s + t.amount, 0);
  const best = state.cards.reduce((top, c) => (!top || c.value > top.value ? c : top), null);
  const vault = vaultCards();
  return {
    packsOpened: state.cards.filter((c) => packBySlug(c.pack)).length,
    spent,
    received,
    best,
    vaultCount: vault.length,
    vaultValue: vault.reduce((s, c) => s + c.value, 0),
    vaultBuyback: vault.reduce((s, c) => s + buybackOf(c), 0),
  };
}

/** Points du mois en cours (remis à zéro le 1er). */
export function monthlyPoints() {
  return state.points.month === monthKey() ? state.points.monthly : 0;
}

/** Badge atteint et avancement vers le suivant. */
export const badgeProgress = () => progress(state.xp);

/* ------------------------------------------------------------------ interne */

function addTx(type, amount, label) {
  state.tx.unshift({ id: uid('t'), type, amount, label, at: Date.now() });
  if (state.tx.length > MAX_TX) state.tx.length = MAX_TX;
}

function addPoints(cents) {
  const pts = Math.floor((cents / 100) * RULES.pointsPerEuro);
  if (pts <= 0) return;
  if (state.points.month !== monthKey()) state.points = { ...state.points, month: monthKey(), monthly: 0 };
  state.points.monthly += pts;
  state.points.total += pts;
}

/** 1 € engagé = 1 XP. */
function addXp(cents) {
  state.xp += Math.floor(cents / 100);
}

/**
 * Consomme un tirage vérifiable : le ticket dépend de la graine serveur, de la
 * graine client, du compteur et du jeu. Le compteur avance à chaque appel.
 */
function nextRoll(game) {
  const f = state.fair;
  const roll = { game, nonce: f.nonce, hash: f.serverHash, clientSeed: f.clientSeed, ticket: ticketFor(f.serverSeed, f.clientSeed, f.nonce, game) };
  f.nonce += 1;
  return roll;
}

function logRoll(roll, label, outcome) {
  state.rolls.unshift({ id: uid('r'), at: Date.now(), label, outcome, ...roll });
  if (state.rolls.length > MAX_ROLLS) state.rolls.length = MAX_ROLLS;
}

const paused = () => state.limits.pauseUntil > Date.now();

/* ------------------------------------------------------------------- compte */

const PSEUDO = /^[\p{L}\p{N}_-]{3,16}$/u;

export function signup(pseudo) {
  const name = String(pseudo || '').trim();
  if (!PSEUDO.test(name)) return fail('pseudo', 'Choisis un pseudo de 3 à 16 caractères (lettres, chiffres, tiret ou underscore).');
  if (state.user) return fail('exists', `Un compte démo existe déjà sur cet appareil (${state.user.pseudo}). Connecte-toi, ou réinitialise la démo dans les paramètres.`);
  state.user = { pseudo: name, since: Date.now() };
  state.session = true;
  state.balance += RULES.welcomeCredit;
  addTx('bonus', RULES.welcomeCredit, 'Crédit de bienvenue (démo)');
  commit();
  return { ok: true };
}

export function login(pseudo) {
  const name = String(pseudo || '').trim();
  if (!state.user) return fail('unknown', "Aucun compte démo sur cet appareil : passe par l'inscription.");
  if (state.user.pseudo.toLowerCase() !== name.toLowerCase()) return fail('unknown', 'Aucun compte démo à ce nom sur cet appareil.');
  state.session = true;
  commit();
  return { ok: true };
}

export function logout() {
  state.session = false;
  commit();
}

/** Efface toutes les données locales du compte démo (le thème choisi est conservé à part). */
export function resetDemo() {
  state = fresh();
  commit();
}

/* -------------------------------------------------------------------- solde */

/** Recharge fictive du solde. */
export function deposit(cents) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour recharger ton solde.');
  if (!Number.isInteger(cents) || cents <= 0 || cents > 1000_00) return fail('amount', 'Montant de recharge invalide.');
  state.balance += cents;
  addTx('depot', cents, 'Recharge (crédit fictif)');
  commit();
  return { ok: true };
}

/* -------------------------------------------------------------------- packs */

/**
 * Achète et tire `qty` packs. Les cartes rejoignent le coffre tout de suite ;
 * elles restent « à révéler » tant que l'animation d'ouverture n'a pas eu lieu.
 */
export function buyPacks(slug, qty) {
  const pack = packBySlug(slug);
  if (!pack) return fail('pack', 'Pack introuvable.');
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour acheter un pack.');
  if (!Number.isInteger(qty) || qty < 1 || qty > RULES.maxPacksPerOrder) return fail('qty', `Entre 1 et ${RULES.maxPacksPerOrder} packs par achat.`);

  const now = Date.now();
  if (paused()) return fail('pause', 'Ton compte est en pause : les achats sont suspendus.');
  const total = pack.price * qty;
  if (state.limits.daily != null && spentToday(now) + total > state.limits.daily) return fail('limit', 'Cet achat dépasserait ta limite de dépenses quotidienne.');
  if (state.balance < total) return fail('balance', 'Solde insuffisant.');

  const pulls = [];
  for (let i = 0; i < qty; i++) {
    const roll = nextRoll(`pack:${pack.slug}`);
    const drop = resolveTicket(pack, roll.ticket);
    pulls.push({ uid: uid('c'), cardId: drop.card.id, pack: pack.slug, rarity: drop.rarity, value: drop.card.value, at: now + i, status: 'coffre', roll: { nonce: roll.nonce, ticket: roll.ticket, hash: roll.hash } });
    logRoll(roll, pack.name, { cardId: drop.card.id });
  }

  state.balance -= total;
  state.cards.push(...pulls);
  state.pending = pulls.map((p) => p.uid);
  state.lastOrder = { pack: pack.slug, qty, total, at: now, uids: pulls.map((p) => p.uid) };
  addTx('achat', -total, `${qty} × ${pack.name}`);
  addPoints(total);
  addXp(total);

  if (pack.giveaway) {
    const g = state.giveaways[pack.giveaway] || { joined: false, followed: false, tickets: 0 };
    g.tickets += qty;
    state.giveaways[pack.giveaway] = g;
  }

  commit();
  return { ok: true, pulls };
}

/** Marque des cartes comme révélées (fin de l'animation d'ouverture). */
export function markRevealed(uids) {
  const set = new Set(uids);
  const before = state.pending.length;
  state.pending = state.pending.filter((id) => !set.has(id));
  if (state.pending.length !== before) commit();
}

/* ------------------------------------------------------------------- coffre */

/** Rachat instantané d'une ou plusieurs cartes du coffre. */
export function sellCards(uids) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour revendre une carte.');
  const targets = state.cards.filter((c) => uids.includes(c.uid) && c.status === 'coffre');
  if (!targets.length) return fail('none', 'Aucune carte à revendre.');
  const now = Date.now();
  let total = 0;
  for (const owned of targets) {
    const credit = buybackOf(owned);
    owned.status = 'vendue';
    owned.soldFor = credit;
    owned.soldAt = now;
    total += credit;
    const card = cardById(owned.cardId);
    addTx('rachat', credit, `Rachat — ${card ? card.name : 'carte'}`);
  }
  state.balance += total;
  state.pending = state.pending.filter((id) => !uids.includes(id));
  addPoints(total);
  commit();
  return { ok: true, total, count: targets.length };
}

/** Demande d'expédition de cartes du coffre. Les frais sont prélevés sur le solde. */
export function requestShipment({ uids, zone, address }) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour demander une livraison.');
  if (!RULES.shipping[zone]) return fail('zone', 'Zone de livraison inconnue.');
  const targets = state.cards.filter((c) => uids.includes(c.uid) && c.status === 'coffre');
  if (!targets.length) return fail('none', 'Aucune carte à expédier.');
  const required = ['name', 'line1', 'zip', 'city'];
  if (required.some((k) => !String(address?.[k] || '').trim())) return fail('address', "Complète l'adresse de livraison.");
  const fee = shippingFee(zone, targets.length);
  if (state.balance < fee) return fail('balance', 'Solde insuffisant pour régler les frais de livraison.');

  const id = uid('s');
  const now = Date.now();
  state.balance -= fee;
  targets.forEach((c) => {
    c.status = 'livraison';
    c.shipmentId = id;
  });
  state.shipments.unshift({
    id,
    uids: targets.map((c) => c.uid),
    zone,
    fee,
    at: now,
    status: 'preparation',
    address: Object.fromEntries(['name', 'line1', 'line2', 'zip', 'city'].map((k) => [k, String(address[k] || '').trim().slice(0, 120)])),
  });
  state.pending = state.pending.filter((pid) => !uids.includes(pid));
  addTx('livraison', -fee, `Frais de livraison (${targets.length} carte${targets.length > 1 ? 's' : ''})`);
  commit();
  return { ok: true, id, fee };
}

/* ---------------------------------------------------------------- évolution */

/** Chance de réussite (0 à 1) d'une évolution, d'après les deux cotes en centimes. */
export function evolutionChance(stakeValue, targetValue) {
  const { edge, maxChance } = RULES.evolution;
  return Math.min(maxChance, (stakeValue / targetValue) * (1 - edge));
}

/**
 * Mise une carte du coffre pour tenter d'obtenir la carte visée.
 * Réussite : la carte misée est consommée, la carte visée rejoint le coffre.
 * Échec : la carte misée est perdue.
 */
export function evolve(stakeUid, targetId) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour tenter une évolution.');
  if (paused()) return fail('pause', 'Ton compte est en pause : les évolutions sont suspendues.');
  const stake = ownedByUid(stakeUid);
  const target = cardById(targetId);
  if (!stake || stake.status !== 'coffre') return fail('stake', "Cette carte n'est plus dans ton coffre.");
  if (!target || target.value < stake.value * RULES.evolution.minRatio) return fail('target', 'La carte visée doit valoir nettement plus que la carte misée.');

  const chance = evolutionChance(stake.value, target.value);
  const winBelow = Math.round(chance * TICKETS);
  const roll = nextRoll('evolution');
  const win = roll.ticket < winBelow;
  const now = Date.now();
  let gained = null;

  if (win) {
    stake.status = 'evoluee';
    stake.endedAt = now;
    gained = { uid: uid('c'), cardId: target.id, pack: 'evolution', rarity: rarityByValue(target.value), value: target.value, at: now, status: 'coffre', from: stake.uid, roll: { nonce: roll.nonce, ticket: roll.ticket, hash: roll.hash } };
    state.cards.push(gained);
  } else {
    stake.status = 'perdue';
    stake.endedAt = now;
  }
  state.pending = state.pending.filter((id) => id !== stake.uid);
  addXp(stake.value);
  logRoll(roll, 'Évolution', { win, winBelow, stakeId: stake.cardId, targetId: target.id });
  commit();
  return { ok: true, win, chance, winBelow, ticket: roll.ticket, gained };
}

/* ---------------------------------------------------------- récompense du jour */

export const dailyAvailable = () => state.daily.lastDay !== dayKey();

/** Récompense du jour : une fois par jour civil, montant multiplié par le badge. */
export function claimDaily() {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour récupérer ta récompense.');
  if (!dailyAvailable()) return fail('done', 'Tu as déjà récupéré ta récompense du jour.');
  const roll = nextRoll('daily');
  let cursor = 0;
  let base = RULES.dailyReward[0][0];
  for (const [amount, tickets] of RULES.dailyReward) {
    cursor += tickets;
    if (roll.ticket < cursor) {
      base = amount;
      break;
    }
  }
  const { current } = badgeProgress();
  const amount = Math.round(base * current.daily);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  state.daily = { lastDay: dayKey(), streak: state.daily.lastDay === dayKey(yesterday) ? state.daily.streak + 1 : 1 };
  state.balance += amount;
  addTx('bonus', amount, `Récompense du jour (×${current.daily})`);
  logRoll(roll, 'Récompense du jour', { base, amount });
  commit();
  return { ok: true, base, amount, multiplier: current.daily, ticket: roll.ticket };
}

/* ------------------------------------------------------------------- équité */

/**
 * Renouvelle les graines : la graine serveur en cours est révélée (archivée)
 * et une nouvelle paire est créée. C'est le seul moyen de changer de graine
 * client, pour qu'on ne puisse pas la choisir en connaissant la graine serveur.
 */
export function rotateSeeds(clientSeed) {
  const next = String(clientSeed || '').trim() || newClientSeed();
  if (!isValidClientSeed(next)) return fail('seed', 'La graine client doit faire 4 à 64 caractères, sans espace ni deux-points.');
  const { archive, ...current } = state.fair;
  state.fair = { ...freshSeeds(next), archive: [{ ...current, until: Date.now() }, ...archive].slice(0, MAX_ARCHIVE) };
  commit();
  return { ok: true };
}

/** Graine serveur révélée correspondant à une empreinte, si elle a été renouvelée depuis. */
export const revealedSeed = (hash) => state.fair.archive.find((a) => a.serverHash === hash)?.serverSeed || null;

/* ---------------------------------------------------------------- giveaways */

export function giveawayEntry(id) {
  return state.giveaways[id] || { joined: false, followed: false, tickets: 0 };
}

export function updateGiveaway(id, patch) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour participer.');
  state.giveaways[id] = { ...giveawayEntry(id), ...patch };
  commit();
  return { ok: true };
}

/* --------------------------------------------------------------- paramètres */

export function setSetting(key, value) {
  if (!(key in state.settings)) return;
  state.settings[key] = value;
  commit();
}

/** Limite de dépenses quotidienne en centimes, ou null pour la retirer. */
export function setDailyLimit(cents) {
  state.limits.daily = cents == null ? null : Math.max(0, Math.round(cents));
  commit();
}

/** Met le compte en pause (achats bloqués) pendant `hours` heures ; 0 lève la pause. */
export function setPause(hours) {
  state.limits.pauseUntil = hours > 0 ? Date.now() + hours * 3600_000 : 0;
  commit();
}
