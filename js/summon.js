import { createPokemon, allSpecies, getSpecies, displayName, pokeName } from './pokemon.js';
import { addLog } from './game-log.js';
import { todayKey } from './quests.js';
import { currentPlayGen } from './game.js';

/** Invocation / gacha Shinobiiii */
export const SUMMON = {
  FREE_DAILY: 1,
  TICKET_PRICE: 2500,
  MULTI_COUNT: 10,
  /** Pity soft : rare+ garanti */
  PITY_RARE: 10,
  /** Pity hard : légendaire garanti */
  PITY_LEGENDARY: 50,
  LEVEL_MIN: 5,
  LEVEL_MAX: 15,
  /** Probabilités de rareté (hors pity) */
  RATES: {
    common: 0.68,
    uncommon: 0.22,
    rare: 0.085,
    legendary: 0.015,
  },
};

export const RARITY_LABELS = {
  common: 'Commun',
  uncommon: 'Peu commun',
  rare: 'Rare',
  legendary: 'Légendaire',
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary'];

let poolsCache = null;

export function defaultSummonState() {
  return {
    tickets: SUMMON.FREE_DAILY,
    pity: 0,
    totalPulls: 0,
    lastFreeDay: todayKey(),
  };
}

/** Dernier crédit quotidien (pour toast au boot). */
let pendingDailyTicketGrant = 0;

/** Initialise / migre `state.summon` et crédite le ticket quotidien. */
export function ensureSummon(state) {
  if (!state.summon || typeof state.summon !== 'object') {
    state.summon = defaultSummonState();
    return state.summon;
  }
  if (typeof state.summon.tickets !== 'number') state.summon.tickets = 0;
  if (typeof state.summon.pity !== 'number') state.summon.pity = 0;
  if (typeof state.summon.totalPulls !== 'number') state.summon.totalPulls = 0;
  claimDailyFreeTickets(state);
  return state.summon;
}

/** Crédite les tickets gratuits du jour (idempotent). */
export function claimDailyFreeTickets(state) {
  ensureSummonShape(state);
  const day = todayKey();
  if (state.summon.lastFreeDay === day) {
    return { ok: false, reason: 'already', tickets: state.summon.tickets };
  }
  state.summon.lastFreeDay = day;
  state.summon.tickets += SUMMON.FREE_DAILY;
  pendingDailyTicketGrant = SUMMON.FREE_DAILY;
  addLog(
    state,
    `Invocation : +${SUMMON.FREE_DAILY} ticket${SUMMON.FREE_DAILY > 1 ? 's' : ''} quotidien${SUMMON.FREE_DAILY > 1 ? 's' : ''}.`,
    'unlock'
  );
  return { ok: true, tickets: state.summon.tickets, granted: SUMMON.FREE_DAILY };
}

/** Lit et consomme le crédit quotidien en attente (0 si rien). */
export function takePendingDailyTicketGrant() {
  const n = pendingDailyTicketGrant;
  pendingDailyTicketGrant = 0;
  return n;
}

function ensureSummonShape(state) {
  if (!state.summon || typeof state.summon !== 'object') {
    state.summon = defaultSummonState();
  }
}

/**
 * Score rareté : captureRate bas + génération élevée → plus rare.
 * Gen récente diminue le score (plus « précieux » pour le pool).
 */
export function rarityScore(sp) {
  const cr = Number(sp?.captureRate ?? 45);
  const gen = Number(sp?.generation ?? 1);
  return cr - (gen - 1) * 4;
}

/** Classe une espèce dans un pool. */
export function classifyRarity(sp) {
  const cr = Number(sp?.captureRate ?? 45);
  const score = rarityScore(sp);
  if (cr <= 3 || score <= 8) return 'legendary';
  if (cr <= 45 || score <= 48) return 'rare';
  if (cr <= 120 || score <= 130) return 'uncommon';
  return 'common';
}

function buildPools(genFilter = null) {
  const pools = { common: [], uncommon: [], rare: [], legendary: [] };
  const all = allSpecies().filter((sp) => {
    if (!sp?.id) return false;
    if (genFilter == null) return true;
    return (Number(sp.generation) || 1) === Number(genFilter);
  });
  for (const sp of all) {
    const r = classifyRarity(sp);
    pools[r].push(sp);
  }
  for (const key of RARITY_ORDER) {
    if (!pools[key].length) {
      pools[key] = all.slice(0, 50);
    }
  }
  return pools;
}

export function getPools(genFilter = null) {
  const key = genFilter == null ? 'all' : `g${genFilter}`;
  if (!poolsCache) poolsCache = {};
  if (!poolsCache[key] || !poolsCache[key].common?.length) {
    poolsCache[key] = buildPools(genFilter);
  }
  return poolsCache[key];
}

/** Invalide le cache (tests / reload shinobi). */
export function resetPoolsCache() {
  poolsCache = null;
}

function pickWeighted(list) {
  if (!list.length) return null;
  let total = 0;
  const weights = list.map((sp) => {
    const score = Math.max(1, rarityScore(sp));
    const genBoost = 1 + (Number(sp.generation || 1) - 1) * 0.04;
    const w = (280 / score) * genBoost;
    total += w;
    return w;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return list[i];
  }
  return list[list.length - 1];
}

function rollRarity(pity) {
  if (pity >= SUMMON.PITY_LEGENDARY) return 'legendary';
  if (pity >= SUMMON.PITY_RARE) {
    return Math.random() < 0.12 ? 'legendary' : 'rare';
  }
  const { RATES } = SUMMON;
  const r = Math.random();
  if (r < RATES.legendary) return 'legendary';
  if (r < RATES.legendary + RATES.rare) return 'rare';
  if (r < RATES.legendary + RATES.rare + RATES.uncommon) return 'uncommon';
  return 'common';
}

function randomLevel() {
  const { LEVEL_MIN, LEVEL_MAX } = SUMMON;
  return LEVEL_MIN + Math.floor(Math.random() * (LEVEL_MAX - LEVEL_MIN + 1));
}

function placePokemon(state, poke) {
  state.caught[poke.speciesId] = true;
  state.seen[poke.speciesId] = true;
  state.stats.catches = (state.stats.catches || 0) + 1;
  if (state.team.length < 6) state.team.push(poke);
  else state.box.push(poke);
}

/**
 * Achète des tickets d’invocation avec l’argent.
 * @returns {{ ok: boolean, reason?: string, tickets?: number, cost?: number }}
 */
export function buyTickets(state, qty = 1) {
  ensureSummon(state);
  const n = Math.max(1, Math.floor(Number(qty) || 1));
  const cost = SUMMON.TICKET_PRICE * n;
  if (state.money < cost) return { ok: false, reason: 'no-money' };
  state.money -= cost;
  state.summon.tickets += n;
  addLog(state, `Acheté ${n}× ticket d’invocation (−${cost.toLocaleString('fr-FR')} 両).`, 'shop');
  return { ok: true, tickets: state.summon.tickets, cost };
}

/**
 * Une invocation unique. Consomme 1 ticket.
 * @returns {{ ok: boolean, reason?: string, pokemon?: object, rarity?: string, pity?: number, pityTriggered?: boolean }}
 */
export function pullOnce(state) {
  ensureSummon(state);
  if ((state.summon.tickets || 0) < 1) return { ok: false, reason: 'no-ticket' };

  const playGen = currentPlayGen(state);
  const pools = getPools(playGen);
  const pityBefore = state.summon.pity;
  const pityTriggered =
    pityBefore + 1 >= SUMMON.PITY_RARE || pityBefore + 1 >= SUMMON.PITY_LEGENDARY;
  const rarity = rollRarity(pityBefore + 1);
  const sp = pickWeighted(pools[rarity]) || pickWeighted(pools.common);
  if (!sp || !getSpecies(sp.id)) return { ok: false, reason: 'no-species' };

  state.summon.tickets -= 1;
  state.summon.totalPulls += 1;
  state.summon.pity += 1;

  if (rarity === 'legendary') state.summon.pity = 0;
  else if (rarity === 'rare' && pityBefore + 1 >= SUMMON.PITY_RARE) state.summon.pity = 0;

  const poke = createPokemon(sp.id, randomLevel());
  placePokemon(state, poke);

  const label = RARITY_LABELS[rarity] || rarity;
  addLog(
    state,
    `Invocation ${label} : ${pokeName(poke)}${poke.shiny ? ' (chromatique)' : ''} !`,
    rarity === 'legendary' || rarity === 'rare' ? 'unlock' : 'catch'
  );

  return {
    ok: true,
    pokemon: poke,
    rarity,
    pity: state.summon.pity,
    pityTriggered,
    species: sp,
  };
}

/**
 * Multi-invocation (défaut ×10).
 * @returns {{ ok: boolean, reason?: string, results?: Array, pokemon?: Array }}
 */
export function pullMulti(state, count = SUMMON.MULTI_COUNT) {
  ensureSummon(state);
  const n = Math.max(1, Math.floor(Number(count) || SUMMON.MULTI_COUNT));
  if ((state.summon.tickets || 0) < n) {
    return { ok: false, reason: 'no-ticket', need: n, have: state.summon.tickets };
  }
  const results = [];
  for (let i = 0; i < n; i++) {
    const res = pullOnce(state);
    if (!res.ok) break;
    results.push(res);
  }
  return {
    ok: results.length === n,
    results,
    pokemon: results.map((r) => r.pokemon),
    pulled: results.length,
  };
}

export function ticketsNeededForMulti(state) {
  ensureSummon(state);
  return Math.max(0, SUMMON.MULTI_COUNT - (state.summon.tickets || 0));
}

export function pityProgress(state) {
  ensureSummon(state);
  const pity = state.summon.pity || 0;
  return {
    pity,
    rareAt: SUMMON.PITY_RARE,
    legendaryAt: SUMMON.PITY_LEGENDARY,
    untilRare: Math.max(0, SUMMON.PITY_RARE - pity),
    untilLegendary: Math.max(0, SUMMON.PITY_LEGENDARY - pity),
    rarePct: Math.min(100, (pity / SUMMON.PITY_RARE) * 100),
    legendaryPct: Math.min(100, (pity / SUMMON.PITY_LEGENDARY) * 100),
  };
}

export function poolStats(genFilter = null) {
  const pools = getPools(genFilter);
  return Object.fromEntries(RARITY_ORDER.map((k) => [k, pools[k].length]));
}

export { displayName, RARITY_ORDER };
