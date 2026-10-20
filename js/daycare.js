import { addLog } from './game-log.js';
import {
  createPokemon,
  getSpecies,
  displayName,
  pokeName,
  allSpecies,
} from './pokemon.js';
import { isDemoMode, formatRemain } from './expedition.js';

export { formatRemain };

export const DAYCARE_DURATIONS = [
  { id: '15m', label: '15 min', ms: 15 * 60 * 1000 },
  { id: '30m', label: '30 min', ms: 30 * 60 * 1000 },
  { id: '1h', label: '1 h', ms: 60 * 60 * 1000 },
];

const DEMO_DURATION = { id: '30s', label: '30 s (demo)', ms: 30_000 };

let dayUid = 1;

export function getDaycareDurations() {
  const list = [...DAYCARE_DURATIONS];
  if (isDemoMode()) list.unshift(DEMO_DURATION);
  return list;
}

export function ensureDaycare(state) {
  if (!Array.isArray(state.daycare)) state.daycare = [];
  return state.daycare;
}

export function daycareBusyUids(state) {
  const set = new Set();
  for (const job of ensureDaycare(state)) {
    if (job.claimed) continue;
    for (const uid of job.parentUids || []) set.add(uid);
  }
  return set;
}

export function isInDaycare(state, uid) {
  return daycareBusyUids(state).has(uid);
}

export function daycareRemainingMs(job, now = Date.now()) {
  if (job.claimed) return 0;
  return Math.max(0, (job.startedAt || 0) + (job.durationMs || 0) - now);
}

export function isDaycareReady(job, now = Date.now()) {
  return !job.claimed && daycareRemainingMs(job, now) <= 0;
}

export function pendingDaycareCount(state) {
  return ensureDaycare(state).filter((j) => isDaycareReady(j)).length;
}

function findOwned(state, uid) {
  return (
    state.team.find((p) => p.uid === uid) ||
    state.box.find((p) => p.uid === uid) ||
    null
  );
}

function baseFormId(speciesId) {
  const parentOf = new Map();
  for (const s of allSpecies()) {
    const to = s.evolvesTo?.to;
    if (to != null) parentOf.set(to, s.id);
  }
  let id = speciesId;
  let guard = 0;
  while (parentOf.has(id) && guard++ < 8) id = parentOf.get(id);
  return id;
}

function randomSameGenCommon(gen) {
  const pool = allSpecies().filter(
    (s) => s.generation === gen && (s.captureRate || 45) >= 45
  );
  const commons = pool.filter((s) => (s.captureRate || 45) >= 90);
  const use = commons.length ? commons : pool;
  if (!use.length) return 1;
  return use[Math.floor(Math.random() * use.length)].id;
}

export function pickOffspringSpecies(parentA, parentB) {
  const spA = getSpecies(parentA.speciesId);
  const spB = getSpecies(parentB?.speciesId) || spA;
  if (Math.random() < 0.7 && spA) return baseFormId(spA.id);
  const gen = spA?.generation || spB?.generation || 1;
  return randomSameGenCommon(gen);
}

export function depositDaycare(state, { parentUids, durationMs }, extraBusy = new Set()) {
  ensureDaycare(state);
  const uids = [...new Set(parentUids || [])];
  if (uids.length !== 2) return { ok: false, reason: 'count' };

  const durations = getDaycareDurations();
  if (!durations.some((d) => d.ms === durationMs)) return { ok: false, reason: 'duration' };

  const busy = daycareBusyUids(state);
  for (const u of extraBusy) busy.add(u);

  for (const uid of uids) {
    if (busy.has(uid)) return { ok: false, reason: 'busy' };
    if (!findOwned(state, uid)) return { ok: false, reason: 'missing' };
  }

  const teamLeft = state.team.filter((p) => !uids.includes(p.uid) && !busy.has(p.uid));
  if (teamLeft.length < 1) return { ok: false, reason: 'last-team' };

  const parents = uids.map((u) => findOwned(state, u));
  const job = {
    id: `day_${Date.now()}_${dayUid++}`,
    parentUids: uids,
    startedAt: Date.now(),
    durationMs,
    eggSpeciesId: null,
    claimed: false,
  };
  state.daycare.push(job);
  addLog(
    state,
    `Pension : ${pokeName(parents[0])} & ${pokeName(parents[1])} déposés`,
    'heal'
  );
  return { ok: true, job };
}

/** Réclame tous les jobs de pension prêts (éclosions). */
export function claimAllReadyDaycare(state, now = Date.now()) {
  ensureDaycare(state);
  const claimed = [];
  for (const job of [...state.daycare]) {
    if (!isDaycareReady(job, now)) continue;
    const res = claimDaycare(state, job.id);
    if (res.ok) claimed.push(res);
  }
  return { count: claimed.length, results: claimed };
}

export function claimDaycare(state, jobId) {
  ensureDaycare(state);
  const job = state.daycare.find((j) => j.id === jobId);
  if (!job || job.claimed) return { ok: false, reason: 'unavailable' };
  if (!isDaycareReady(job)) return { ok: false, reason: 'not-ready' };

  const parents = (job.parentUids || []).map((u) => findOwned(state, u)).filter(Boolean);
  if (parents.length < 1) return { ok: false, reason: 'missing' };

  const speciesId = pickOffspringSpecies(parents[0], parents[1] || parents[0]);
  job.eggSpeciesId = speciesId;

  const avgLvl = Math.floor(
    parents.reduce((s, p) => s + (p.level || 1), 0) / parents.length
  );
  const hatchLevel = Math.max(1, Math.min(10, Math.floor(avgLvl / 5) + 1));
  const baby = createPokemon(speciesId, hatchLevel);
  state.caught[speciesId] = true;
  state.seen[speciesId] = true;
  state.stats.catches++;
  if (state.team.length < 6) state.team.push(baby);
  else state.box.push(baby);

  job.claimed = true;
  const name = displayName(getSpecies(speciesId));
  addLog(state, `L’œuf a éclos : ${name} (N.${hatchLevel}) !`, 'catch');
  return { ok: true, pokemon: baby };
}
