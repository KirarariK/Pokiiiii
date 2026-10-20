import { createPokemon, allSpecies, getSpecies, displayName, pokeName } from './pokemon.js';
import { addLog } from './game-log.js';
import { todayKey } from './quests.js';
import { currentPlayGen } from './game.js';

/** Kuchiyose / gacha Shinobiiii — rates anti-broken */
export const SUMMON = {
  FREE_DAILY: 1,
  TICKET_PRICE: 4500,
  MULTI_COUNT: 10,
  /** Pity soft : rare+ garanti */
  PITY_RARE: 15,
  /** Pity hard : légendaire garanti */
  PITY_LEGENDARY: 80,
  /** Niveaux bas : pas de monstre niveau 15 dès le départ */
  LEVEL_MIN: 3,
  LEVEL_MAX: 8,
  /** Probabilités hors pity (légendaire rare) */
  RATES: {
    common: 0.74,
    uncommon: 0.19,
    rare: 0.055,
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
    `Kuchiyose : +${SUMMON.FREE_DAILY} ticket${SUMMON.FREE_DAILY > 1 ? 's' : ''} quotidien${SUMMON.FREE_DAILY > 1 ? 's' : ''}.`,
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

function speciesBst(sp) {
  if (!sp) return 400;
  return (sp.hp || 0) + (sp.atk || 0) + (sp.def || 0) + (sp.spa || 0) + (sp.spd || 0) + (sp.spe || 0);
}

/**
 * Score rareté : formes faibles / début de ligne → commun.
 * Formes finales / BST élevé → rare / légendaire.
 */
export function rarityScore(sp) {
  const cr = Number(sp?.captureRate ?? 45);
  const bst = speciesBst(sp);
  // Plus le score est bas, plus c’est « précieux » pour le tirage pondéré
  return cr - (bst - 350) / 8;
}

/**
 * Vrai début de ligne (enfant / académie) — plafonné uncommon.
 * Ne pas traiter jonin/hokage/base générique comme « early ».
 */
function isEarlyForm(sp) {
  const id = (sp?.formId || '').toLowerCase();
  if (/(^|-)(enfant|academy|genin|ado)(-|$)/.test(id)) return true;
  // Première étape d’une ligne + BST bas
  if (sp?.evolvesTo?.to && speciesBst(sp) < 400) return true;
  return false;
}

/**
 * Classe une espèce (hors contexte de saga).
 * Pour les pools réels, préférer buildPools (rang relatif).
 */
export function classifyRarity(sp) {
  const bst = speciesBst(sp);
  const cr = Number(sp?.captureRate ?? 45);
  const early = isEarlyForm(sp);
  if (bst >= 690 || (bst >= 660 && cr <= 13 && !early)) return 'legendary';
  if (early && bst < 520) {
    if (bst >= 420 || cr <= 35) return 'uncommon';
    return 'common';
  }
  if (bst >= 640 && cr <= 15) return 'legendary';
  if (bst >= 540 || cr <= 20) return 'rare';
  if (bst >= 400 || cr <= 50) return 'uncommon';
  return 'common';
}

function removeFromPools(pools, sp) {
  for (const k of ['common', 'uncommon', 'rare', 'legendary']) {
    const idx = pools[k].findIndex((s) => s.id === sp.id);
    if (idx >= 0) pools[k].splice(idx, 1);
  }
}

/**
 * Pools par saga : rang BST relatif (évite gen1 0 rare / gen3 full rare).
 * Cible approx : ~55% common · ~25% uncommon · ~15% rare · ~5% legendary
 */
function buildPools(genFilter = null) {
  const pools = { common: [], uncommon: [], rare: [], legendary: [] };
  const all = allSpecies().filter((sp) => {
    if (!sp?.id) return false;
    if (genFilter == null) return true;
    return (Number(sp.generation) || 1) === Number(genFilter);
  });
  if (!all.length) return pools;

  const sorted = [...all].sort((a, b) => {
    const d = speciesBst(a) - speciesBst(b);
    if (d !== 0) return d;
    return Number(b.captureRate ?? 45) - Number(a.captureRate ?? 45);
  });
  const n = sorted.length;
  const assigned = new Set();

  const pushUnique = (bucket, sp) => {
    if (assigned.has(sp.id)) return;
    assigned.add(sp.id);
    pools[bucket].push(sp);
  };

  for (let i = 0; i < n; i++) {
    const sp = sorted[i];
    const bst = speciesBst(sp);
    const cr = Number(sp.captureRate ?? 45);
    const early = isEarlyForm(sp);
    const rank = n <= 1 ? 0.5 : i / (n - 1); // 0 = plus faible, 1 = plus fort

    // Dieux absolus (toute saga)
    if (bst >= 690 || (bst >= 660 && cr <= 13 && !early)) {
      pushUnique('legendary', sp);
      continue;
    }
    // Enfants / genin : jamais rare+ (sauf monstre absolu déjà géré)
    if (early && bst < 520) {
      if (rank >= 0.9 || bst >= 450) pushUnique('uncommon', sp);
      else pushUnique('common', sp);
      continue;
    }
    // Rang relatif dans la saga
    if (rank >= 0.955 || (bst >= 640 && cr <= 18)) pushUnique('legendary', sp);
    else if (rank >= 0.8 || bst >= 560) pushUnique('rare', sp);
    else if (rank >= 0.52 || bst >= 420) pushUnique('uncommon', sp);
    else pushUnique('common', sp);
  }

  // Filets de sécurité (sagas très courtes / skew)
  if (!pools.legendary.length) {
    for (const sp of sorted.slice(-Math.max(2, Math.ceil(n * 0.05)))) {
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('legendary', sp);
    }
  }
  if (pools.rare.length < Math.max(4, Math.ceil(n * 0.08))) {
    const need = Math.max(4, Math.ceil(n * 0.1)) - pools.rare.length;
    const candidates = sorted
      .filter((s) => !pools.legendary.some((x) => x.id === s.id) && !pools.rare.some((x) => x.id === s.id))
      .slice(-need - 4)
      .slice(-need);
    for (const sp of candidates) {
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('rare', sp);
    }
  }
  if (!pools.uncommon.length) {
    const mid = sorted.slice(Math.floor(n * 0.4), Math.floor(n * 0.7));
    for (const sp of mid) {
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('uncommon', sp);
    }
  }
  if (!pools.common.length) {
    for (const sp of sorted.slice(0, Math.max(8, Math.floor(n * 0.4)))) {
      if (pools.legendary.some((x) => x.id === sp.id) || pools.rare.some((x) => x.id === sp.id)) continue;
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('common', sp);
    }
  }
  // Saga courte / full power (ex. gen3) : garantir assez de communs pour le rate 74 %
  const minCommon = Math.max(4, Math.ceil(n * 0.28));
  if (pools.common.length < minCommon) {
    const need = minCommon - pools.common.length;
    const donors = [...pools.uncommon, ...pools.rare]
      .sort((a, b) => speciesBst(a) - speciesBst(b))
      .slice(0, need);
    for (const sp of donors) {
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('common', sp);
    }
  }
  const minUncommon = Math.max(3, Math.ceil(n * 0.15));
  if (pools.uncommon.length < minUncommon) {
    const need = minUncommon - pools.uncommon.length;
    const donors = pools.rare
      .slice()
      .sort((a, b) => speciesBst(a) - speciesBst(b))
      .slice(0, need);
    for (const sp of donors) {
      removeFromPools(pools, sp);
      assigned.delete(sp.id);
      pushUnique('uncommon', sp);
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

function randomLevel(rarity = 'common') {
  const { LEVEL_MIN, LEVEL_MAX } = SUMMON;
  // Légendaires invoqués restent bas niveau (à former)
  const max =
    rarity === 'legendary' ? Math.min(LEVEL_MAX, 6) : rarity === 'rare' ? Math.min(LEVEL_MAX, 7) : LEVEL_MAX;
  return LEVEL_MIN + Math.floor(Math.random() * (max - LEVEL_MIN + 1));
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

  const poke = createPokemon(sp.id, randomLevel(rarity));
  placePokemon(state, poke);

  const label = RARITY_LABELS[rarity] || rarity;
  addLog(
    state,
    `Kuchiyose ${label} : ${pokeName(poke)}${poke.shiny ? ' (aura rare)' : ''} !`,
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
