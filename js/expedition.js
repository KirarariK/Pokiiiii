import { addLog } from './game-log.js';
import { ZONES } from './data/zones.js';
import {
  createPokemon,
  getSpecies,
  displayName,
  pokeName,
  gainXp,
} from './pokemon.js';

/** Durées réelles : 5 min, 15 min, 1 h (+ 30 s si ?demo=) */
export const EXPEDITION_DURATIONS = [
  { id: '5m', label: '5 min', ms: 5 * 60 * 1000 },
  { id: '15m', label: '15 min', ms: 15 * 60 * 1000 },
  { id: '1h', label: '1 h', ms: 60 * 60 * 1000 },
];

const DEMO_DURATION = { id: '30s', label: '30 s (demo)', ms: 30_000 };

const BALL_NAMES = {
  pokeball: 'Poké Ball',
  greatball: 'Super Ball',
  ultraball: 'Hyper Ball',
  masterball: 'Master Ball',
};

let expUid = 1;

function getZone(id) {
  return ZONES.find((z) => z.id === id);
}

export function isDemoMode() {
  try {
    return new URLSearchParams(location.search).has('demo');
  } catch {
    return false;
  }
}

export function getExpeditionDurations() {
  const list = [...EXPEDITION_DURATIONS];
  if (isDemoMode()) list.unshift(DEMO_DURATION);
  return list;
}

export function ensureExpeditions(state) {
  if (!Array.isArray(state.expeditions)) state.expeditions = [];
  return state.expeditions;
}

export function expeditionBusyUids(state) {
  const set = new Set();
  for (const e of ensureExpeditions(state)) {
    if (e.claimed) continue;
    for (const uid of e.pokemonUids || []) set.add(uid);
  }
  return set;
}

export function isOnExpedition(state, uid) {
  return expeditionBusyUids(state).has(uid);
}

export function findOwnedPokemon(state, uid) {
  return (
    state.team.find((p) => p.uid === uid) ||
    state.box.find((p) => p.uid === uid) ||
    null
  );
}

export function expeditionRemainingMs(exp, now = Date.now()) {
  if (exp.claimed) return 0;
  return Math.max(0, (exp.startedAt || 0) + (exp.durationMs || 0) - now);
}

export function isExpeditionReady(exp, now = Date.now()) {
  return !exp.claimed && expeditionRemainingMs(exp, now) <= 0;
}

export function pendingExpeditionCount(state) {
  return ensureExpeditions(state).filter((e) => isExpeditionReady(e)).length;
}

export function formatRemain(ms) {
  if (ms <= 0) return 'Prêt !';
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}

function formatDuration(ms) {
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  return `${Math.round(ms / 3_600_000)} h`;
}

/**
 * Send 1–3 pokemon on a timed expedition.
 * @param {Set<string>} [extraBusy]
 */
export function startExpedition(state, { pokemonUids, durationMs, zoneId }, extraBusy = new Set()) {
  ensureExpeditions(state);
  const uids = [...new Set(pokemonUids || [])].slice(0, 3);
  if (uids.length < 1 || uids.length > 3) return { ok: false, reason: 'count' };

  const durations = getExpeditionDurations();
  if (!durations.some((d) => d.ms === durationMs)) return { ok: false, reason: 'duration' };

  const zone = getZone(zoneId) || getZone(state.currentZone);
  if (!zone || !state.unlockedZones.includes(zone.id)) return { ok: false, reason: 'zone' };

  const busy = expeditionBusyUids(state);
  for (const u of extraBusy) busy.add(u);

  const teamLeft = state.team.filter((p) => !uids.includes(p.uid) && !busy.has(p.uid));
  if (teamLeft.length < 1) return { ok: false, reason: 'last-team' };

  for (const uid of uids) {
    if (busy.has(uid)) return { ok: false, reason: 'busy' };
    if (!findOwnedPokemon(state, uid)) return { ok: false, reason: 'missing' };
  }

  const expedition = {
    id: `exp_${Date.now()}_${expUid++}`,
    pokemonUids: uids,
    startedAt: Date.now(),
    durationMs,
    zoneId: zone.id,
    claimed: false,
  };
  state.expeditions.push(expedition);
  const names = uids.map((u) => pokeName(findOwnedPokemon(state, u))).join(', ');
  addLog(
    state,
    `Expédition vers ${zone.name} : ${names} (${formatDuration(durationMs)})`,
    'unlock'
  );
  return { ok: true, expedition };
}

function pickBallReward(scale) {
  const roll = Math.random();
  if (roll < 0.05 * scale) return { masterball: 1 };
  if (roll < 0.2 * scale) return { ultraball: 1 + Math.floor(Math.random() * 2) };
  if (roll < 0.5 * scale) return { greatball: 1 + Math.floor(Math.random() * 3) };
  return { pokeball: 2 + Math.floor(Math.random() * 4 * scale) };
}

export function claimExpedition(state, expeditionId) {
  ensureExpeditions(state);
  const exp = state.expeditions.find((e) => e.id === expeditionId);
  if (!exp || exp.claimed) return { ok: false, reason: 'unavailable' };
  if (!isExpeditionReady(exp)) return { ok: false, reason: 'not-ready' };

  const zone =
    getZone(exp.zoneId) || getZone(state.currentZone) || getZone(state.unlockedZones?.[0]);
  const party = (exp.pokemonUids || [])
    .map((uid) => findOwnedPokemon(state, uid))
    .filter(Boolean);
  const n = Math.max(1, party.length);
  const hours = Math.max(0.008, (exp.durationMs || 0) / 3_600_000);
  const scale = Math.min(3, 0.5 + hours * 2) * (0.7 + n * 0.15);

  const avgLvl =
    party.reduce((s, p) => s + (p.level || 1), 0) / Math.max(1, party.length) || 5;
  const money = Math.floor((180 + avgLvl * 22 + (zone?.maxLevel || 10) * 8) * scale);
  const balls = pickBallReward(scale);
  const xpEach = Math.floor((40 + avgLvl * 8) * scale);

  state.money += money;
  state.stats.moneyEarned += money;
  for (const [k, v] of Object.entries(balls)) {
    state.balls[k] = (state.balls[k] || 0) + v;
  }
  for (const p of party) gainXp(p, xpEach);

  let found = null;
  const catchChance = Math.min(0.55, 0.18 + hours * 0.25 + n * 0.05);
  if (zone?.pokemon?.length && Math.random() < catchChance) {
    const pool = [...zone.pokemon];
    if (zone.rare?.length && Math.random() < 0.15) {
      for (const r of zone.rare) pool.push(r.id);
    }
    const sid = pool[Math.floor(Math.random() * pool.length)];
    if (getSpecies(sid)) {
      const mid = Math.floor(((zone.minLevel || 2) + (zone.maxLevel || 10)) / 2);
      const lvl = Math.max(1, mid + Math.floor(Math.random() * 3) - 1);
      found = createPokemon(sid, lvl);
      state.caught[sid] = true;
      state.seen[sid] = true;
      state.stats.catches++;
      if (state.team.length < 6) state.team.push(found);
      else state.box.push(found);
    }
  }

  exp.claimed = true;
  const ballBits = Object.entries(balls)
    .map(([k, v]) => `${v}× ${BALL_NAMES[k] || k}`)
    .join(', ');
  let msg = `Expédition terminée (+${money}₽, ${ballBits}, +${xpEach} XP)`;
  if (found) msg += ` · trouvé ${displayName(getSpecies(found.speciesId))} !`;
  addLog(state, msg, 'unlock');

  return { ok: true, reward: { money, balls, xpEach, pokemon: found } };
}
