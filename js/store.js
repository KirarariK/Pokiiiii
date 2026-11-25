// État du compte démo, conservé dans le navigateur (localStorage).
//
// Tout ce module est une maquette de back-office : solde, coffre, tirages,
// rachats et livraisons sont simulés localement. En production, chaque action
// ci-dessous devient un appel à une API authentifiée et l'état fait foi côté
// serveur (en particulier la graine serveur, qui ne doit jamais être lisible).

import { RULES, STORAGE_KEY } from './config.js';
import { cardById, packEdge, resolveTicket, tableVersion } from './catalog.js';
import { progress } from './data/badges.js';
import { PACKS, packBySlug, rarityByValue } from './data/packs.js';
import { TICKETS, isValidClientSeed, newClientSeed, newServerSeed, sha256Hex, ticketFor } from './fair.js';
import { uid } from './rng.js';

const VERSION = 4;
const MAX_TX = 500;
const MAX_ROLLS = 300;
const MAX_ARCHIVE = 20;
const LOCK_MS = RULES.buybackLockMinutes * 60_000;
/** Sous ce montant (centimes), un reste de fonds de bonus ne compte plus. */
const BONUS_DUST = 100;
const CHEAPEST_PACK = Math.min(...PACKS.map((p) => p.price));

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

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
    /** Fonds de bonus compris dans le solde, mises restant à faire, total des mises exigées (voir « Bonus »). */
    bonus: { balance: 0, wagerLeft: 0, required: 0 },
    cards: [], // cartes obtenues (voir buyPacks et evolve)
    pending: [], // uid des cartes achetées mais pas encore révélées
    lastOrder: null,
    tx: [],
    shipments: [],
    points: { month: monthKey(), monthly: 0, total: 0 },
    xp: 0,
    /** Cagnotte de cashback (centimes, avec décimales) et total déjà versé. */
    cashback: { pot: 0, paid: 0 },
    /** Cumuls pour la vue gérant : mises en packs, cotes misées en Évolution, marge théorique. */
    totals: { wagered: 0, staked: 0, theo: 0 },
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
      bonus: { ...base.bonus, ...data.bonus },
      points: { ...base.points, ...data.points },
      cashback: { ...base.cashback, ...data.cashback },
      totals: { ...base.totals, ...data.totals },
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

/** Fin de la garantie de prix d'une carte (horodatage). */
export const lockEnd = (owned) => owned.at + LOCK_MS;

/** Taux de rachat applicable : plein tarif pendant la garantie, tarif différé ensuite. */
export const buybackRate = (owned, now = Date.now()) => (now < lockEnd(owned) ? RULES.buybackRate : RULES.buybackLaterRate);

/** Montant crédité si la carte est revendue maintenant, en centimes. */
export const buybackOf = (owned, now = Date.now()) => Math.round(owned.value * buybackRate(owned, now));

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

/** Part d'assurance des frais de livraison, d'après la cote totale expédiée (centimes). */
export function shippingInsurance(value) {
  const { from, rate } = RULES.shippingInsurance;
  return Math.round(Math.max(0, value - from) * rate);
}

/** Frais de livraison : forfait de la zone, supplément par carte, assurance selon la cote expédiée. */
export function shippingFee(zone, count, value = 0) {
  const z = RULES.shipping[zone];
  if (!z || count <= 0) return 0;
  return z.base + z.perExtraCard * (count - 1) + shippingInsurance(value);
}

const sumTx = (type) => state.tx.filter((t) => t.type === type).reduce((s, t) => s + Math.abs(t.amount), 0);

/** Chiffres clés du profil. */
export function stats() {
  const best = state.cards.reduce((top, c) => (!top || c.value > top.value ? c : top), null);
  const vault = vaultCards();
  const now = Date.now();
  return {
    packsOpened: state.cards.filter((c) => packBySlug(c.pack)).length,
    spent: sumTx('achat'),
    received: sumTx('rachat'),
    best,
    vaultCount: vault.length,
    vaultValue: vault.reduce((s, c) => s + c.value, 0),
    vaultBuyback: vault.reduce((s, c) => s + buybackOf(c, now), 0),
  };
}

/**
 * Le compte vu du site (vue gérant) : ce qui est entré, ce qui est ressorti,
 * et ce que le site doit encore au joueur sous forme de cartes.
 */
export function houseLedger() {
  const value = (status) => state.cards.filter((c) => c.status === status).reduce((s, c) => s + c.value, 0);
  const sales = sumTx('achat');
  const buybacks = sumTx('rachat');
  const cashback = sumTx('cashback');
  return {
    sales,
    buybacks,
    cashback,
    bonuses: state.tx.filter((t) => t.type === 'bonus').reduce((sum, t) => sum + t.amount, 0),
    bonusLeft: state.bonus.balance,
    shippingFees: sumTx('livraison'),
    staked: state.totals.staked,
    theo: Math.round(state.totals.theo),
    /** Résultat de caisse : ventes − rachats − cashback (les cartes encore dues ne sont pas comptées). */
    cash: sales - buybacks - cashback,
    vault: value('coffre'),
    shipped: value('livraison'),
  };
}

/** Points du mois en cours (remis à zéro le 1er). */
export function monthlyPoints() {
  return state.points.month === monthKey() ? state.points.monthly : 0;
}

/** Badge atteint et avancement vers le suivant. */
export const badgeProgress = () => progress(state.xp);

/** Montant de la cagnotte de cashback qu'on peut encaisser, en centimes entiers. */
export const cashbackPot = () => Math.floor(state.cashback.pot);
export const cashbackAvailable = () => cashbackPot() >= RULES.cashback.minimum;

/* Bonus --------------------------------------------------------------------
 * Le solde réunit l'argent du joueur et les fonds de bonus (bonus.balance).
 * Tant qu'un bonus reste à jouer (bonus.wagerLeft > 0) :
 *   - un achat est payé avec l'argent du joueur d'abord, le bonus ensuite ;
 *   - une carte garde la part de son prix payée en bonus (bonusShare) : sa
 *     revente retourne aux fonds de bonus dans la même proportion, et elle ne
 *     peut pas être expédiée ;
 *   - l'argent du joueur, lui, reste retirable à tout moment.
 * Le bonus prend fin de trois façons :
 *   - joué : les mises exigées sont faites, ses fonds deviennent retirables ;
 *   - épuisé : moins d'un euro de fonds de bonus et aucune carte payée avec ;
 *   - bloqué : le solde ne permet plus d'acheter un pack et le coffre est vide.
 * Dans les deux derniers cas, le reliquat de fonds de bonus est repris.
 */

/** Vrai tant qu'un bonus reste à jouer. */
const bonusActive = () => state.bonus.wagerLeft > 0;

/** Part du solde qu'on pourrait retirer : l'argent du joueur, hors fonds de bonus encore en jeu. */
export const withdrawable = () => Math.max(0, state.balance - state.bonus.balance);

/** Bonus en cours, pour l'affichage : fonds, mises restantes, avancement (0 à 1). */
export function bonusStatus() {
  const { balance, wagerLeft, required } = state.bonus;
  return { active: wagerLeft > 0, balance, wagerLeft, progress: required > 0 ? Math.min(1, Math.max(0, 1 - wagerLeft / required)) : 1 };
}

/** Une carte payée en partie avec un bonus ne s'expédie qu'une fois le bonus joué. */
export const canShip = (owned) => !(bonusActive() && owned.bonusShare > 0);

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

/**
 * Enregistre une mise. Tout ce que le site rend au joueur (XP, cashback) est
 * calculé sur la MARGE théorique de cette mise, jamais sur son montant brut :
 * la fidélité ne peut pas coûter plus que ce que le joueur rapporte.
 * @param {number} cents  montant misé
 * @param {number} edge   marge théorique du jeu (0 à 1)
 * @param {boolean} money vrai si la mise est payée avec le solde (elle fait alors avancer le déblocage des bonus)
 */
function recordWager(cents, edge, money) {
  const margin = cents * edge;
  state.cashback.pot += margin * badgeProgress().current.cashback;
  state.xp += (margin / 100) * RULES.xpPerEuroOfMargin;
  state.totals.theo += margin;
  if (money) {
    state.totals.wagered += cents;
    if (state.bonus.wagerLeft > 0) state.bonus.wagerLeft = Math.max(0, state.bonus.wagerLeft - cents);
  } else state.totals.staked += cents;
}

/** Crédite un bonus : il s'ajoute au solde mais reste non retirable tant qu'il n'a pas été joué. */
function addBonus(cents, label) {
  if (cents <= 0) return;
  const toWager = cents * RULES.bonus.wagering;
  state.balance += cents;
  state.bonus.balance += cents;
  state.bonus.wagerLeft += toWager;
  state.bonus.required += toWager;
  addTx('bonus', cents, label);
}

/**
 * Débite le solde : l'argent du joueur part en premier, les fonds de bonus ensuite.
 * @returns {number} part du débit payée avec des fonds de bonus, en centimes
 */
function debit(cents) {
  const fromBonus = Math.min(state.bonus.balance, Math.max(0, cents - withdrawable()));
  state.balance -= cents;
  state.bonus.balance -= fromBonus;
  return fromBonus;
}

/** Clôt le bonus s'il a été joué, épuisé ou bloqué (voir plus haut). À appeler après chaque mouvement. */
function settleBonus() {
  const b = state.bonus;
  const vault = state.cards.filter((c) => c.status === 'coffre');
  const held = vault.some((c) => c.bonusShare > 0);
  if (!b.wagerLeft && !b.balance && !b.required && !held) return;
  if (b.wagerLeft > 0) {
    const exhausted = b.balance < BONUS_DUST && !held;
    const blocked = state.balance < CHEAPEST_PACK && !vault.length;
    if (!exhausted && !blocked) return;
    if (b.balance > 0) {
      state.balance -= b.balance;
      addTx('bonus', -b.balance, 'Bonus clos : reliquat repris');
    }
  }
  state.bonus = { balance: 0, wagerLeft: 0, required: 0 };
  state.cards.forEach((c) => {
    if (c.bonusShare) delete c.bonusShare;
  });
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
  addBonus(RULES.welcomeCredit, 'Crédit de bienvenue (démo)');
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

/** Recharge fictive du solde. Le tout premier dépôt ouvre droit à un bonus, à jouer avant retrait. */
export function deposit(cents) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour recharger ton solde.');
  if (!Number.isInteger(cents) || cents <= 0 || cents > 1000_00) return fail('amount', 'Montant de recharge invalide.');
  const first = !state.tx.some((t) => t.type === 'depot');
  state.balance += cents;
  addTx('depot', cents, 'Recharge (crédit fictif)');
  let bonus = 0;
  if (first) {
    bonus = Math.min(RULES.bonus.firstDepositMax, Math.round(cents * RULES.bonus.firstDepositRate));
    addBonus(bonus, 'Bonus de premier dépôt');
  }
  commit();
  return { ok: true, bonus };
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

  const table = tableVersion(pack);
  const pulls = [];
  for (let i = 0; i < qty; i++) {
    const roll = nextRoll(`pack:${pack.slug}`);
    const drop = resolveTicket(pack, roll.ticket);
    pulls.push({ uid: uid('c'), cardId: drop.card.id, pack: pack.slug, rarity: drop.rarity, value: drop.card.value, at: now + i, status: 'coffre', roll: { nonce: roll.nonce, ticket: roll.ticket, hash: roll.hash } });
    logRoll(roll, pack.name, { cardId: drop.card.id, table });
  }

  const fromBonus = debit(total);
  if (fromBonus > 0) pulls.forEach((p) => (p.bonusShare = fromBonus / total));
  state.cards.push(...pulls);
  state.pending = pulls.map((p) => p.uid);
  state.lastOrder = { pack: pack.slug, qty, total, at: now, uids: pulls.map((p) => p.uid) };
  addTx('achat', -total, `${qty} × ${pack.name}`);
  addPoints(total);
  recordWager(total, packEdge(pack), true);
  settleBonus();

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

/** Rachat d'une ou plusieurs cartes du coffre, au taux en vigueur pour chacune. */
export function sellCards(uids) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour revendre une carte.');
  const targets = state.cards.filter((c) => uids.includes(c.uid) && c.status === 'coffre');
  if (!targets.length) return fail('none', 'Aucune carte à revendre.');
  const now = Date.now();
  const bonus = bonusActive();
  let total = 0;
  let toBonus = 0;
  for (const owned of targets) {
    const credit = buybackOf(owned, now);
    if (bonus && owned.bonusShare > 0) toBonus += Math.round(credit * owned.bonusShare);
    owned.soldRate = buybackRate(owned, now);
    owned.status = 'vendue';
    owned.soldFor = credit;
    owned.soldAt = now;
    total += credit;
    const card = cardById(owned.cardId);
    addTx('rachat', credit, `Rachat — ${card ? card.name : 'carte'}`);
  }
  state.balance += total;
  state.bonus.balance += toBonus;
  state.pending = state.pending.filter((id) => !uids.includes(id));
  settleBonus();
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
  if (targets.some((c) => !canShip(c))) return fail('bonus', "Une carte payée avec un bonus ne s'expédie qu'une fois le bonus joué. D'ici là, tu peux la garder au coffre ou la revendre.");
  const fee = shippingFee(zone, targets.length, targets.reduce((sum, c) => sum + c.value, 0));
  // Les frais couvrent un coût réel (port, assurance) : ils se règlent hors fonds de bonus.
  if (withdrawable() < fee) return fail('balance', bonusActive() ? 'Les frais de livraison se règlent hors bonus : ton solde retirable est insuffisant.' : 'Solde insuffisant pour régler les frais de livraison.');

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
  settleBonus();
  commit();
  return { ok: true, id, fee };
}

/* ---------------------------------------------------------------- évolution */

/** Marge du site sur une évolution : elle grandit avec le multiplicateur visé. */
export function evolutionEdge(multiplier) {
  const { minRatio, edgeMin, edgeSlope, edgeMax } = RULES.evolution;
  return Math.min(edgeMax, edgeMin + edgeSlope * Math.max(0, multiplier - minRatio));
}

/** Chance de réussite (0 à 1) d'une évolution, d'après les deux cotes en centimes. */
export function evolutionChance(stakeValue, targetValue) {
  const multiplier = targetValue / stakeValue;
  return Math.min(RULES.evolution.maxChance, (1 - evolutionEdge(multiplier)) / multiplier);
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
    // La carte obtenue hérite de la part de bonus de la carte misée.
    if (stake.bonusShare > 0) gained.bonusShare = stake.bonusShare;
    state.cards.push(gained);
  } else {
    stake.status = 'perdue';
    stake.endedAt = now;
  }
  state.pending = state.pending.filter((id) => id !== stake.uid);
  recordWager(stake.value, evolutionEdge(target.value / stake.value), false);
  logRoll(roll, 'Évolution', { win, winBelow, stakeId: stake.cardId, targetId: target.id });
  settleBonus();
  commit();
  return { ok: true, win, chance, winBelow, ticket: roll.ticket, gained };
}

/* ----------------------------------------------------------------- cashback */

/**
 * Encaisse la cagnotte de cashback.
 * mode 'cash'  : le montant de la cagnotte, tel quel ;
 * mode 'wheel' : la cagnotte multipliée par un tirage de la roue, dont la
 *                moyenne vaut exactement ×1 (aucun coût en plus pour le site).
 */
export function claimCashback(mode) {
  if (!isLoggedIn()) return fail('auth', 'Connecte-toi pour encaisser ton cashback.');
  const base = cashbackPot();
  if (base < RULES.cashback.minimum) return fail('low', 'Ta cagnotte est encore trop petite pour être encaissée.');
  let factor = 1;
  let roll = null;
  if (mode === 'wheel') {
    roll = nextRoll('cashback');
    let cursor = 0;
    for (const [mult, tickets] of RULES.cashback.wheel) {
      cursor += tickets;
      factor = mult;
      if (roll.ticket < cursor) break;
    }
  }
  const amount = Math.round(base * factor);
  state.cashback.pot -= base;
  state.cashback.paid += amount;
  state.balance += amount;
  addTx('cashback', amount, roll ? `Cashback (roue ×${factor.toLocaleString('fr-FR')})` : 'Cashback');
  if (roll) logRoll(roll, 'Roue du cashback', { base, factor, amount });
  commit();
  return { ok: true, base, factor, amount, ticket: roll?.ticket ?? null };
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
