import { ZONES, STARTERS, ALL_STARTERS } from './data/zones.js';
import {
  createPokemon,
  getSpecies,
  displayName,
  pokeName,
  gainXp,
  canEvolve,
  evolve,
  calcDamage,
  tryCatch,
  catchChance,
  moneyFromWild,
  xpFromWild,
  refreshStats,
  artUrl,
  speciesCount,
  allSpecies,
} from './pokemon.js';
import { addLog } from './game-log.js';
import { ensureDaily, initDailyBaselines } from './quests.js';
import { ensureSummon } from './summon.js';
import { ensureExpeditions, expeditionBusyUids } from './expedition.js';
import { ensureDaycare, daycareBusyUids } from './daycare.js';
import { ensureArena } from './arena.js';
import { eventMultipliers } from './events.js';
import { ascensionBonuses, tryAwardRegionBadge } from './ascension.js';
import { GEN_META } from './data/starters.js';

const SAVE_KEY = 'shinobiiii_save_v1';
const SAVE_KEY_LEGACY = ['shinobiiii_save_v3', 'pokeidle_fan_save_v2', 'pokeidle_fan_save_v1'];

function rewardMults(state) {
  const ev = eventMultipliers();
  const asc = ascensionBonuses(state);
  return {
    xp: ev.xp * asc.xpMult,
    money: ev.money * asc.moneyMult,
    shiny: ev.shiny,
  };
}

export const BALLS = {
  pokeball: { id: 'pokeball', name: 'Parchemin', bonus: 1, price: 280, icon: 'scroll' },
  greatball: { id: 'greatball', name: 'Sceau de liaison', bonus: 1.45, price: 750, icon: 'seal' },
  ultraball: { id: 'ultraball', name: 'Fûinjutsu', bonus: 1.9, price: 1600, icon: 'fuin' },
  // Plus de 100% : très fort mais pas cassé
  masterball: { id: 'masterball', name: 'Sceau des Cinq Kage', bonus: 4.5, price: 90000, icon: 'kage' },
};

export const BRAND = {
  name: 'Nindō',
  tagline: 'Forge ton chemin ninja · Duels · Collection',
  logo: './assets/brand/nindo-logo.jpg',
  hero: './assets/brand/nindo-hero.jpg',
  hubBanner: './assets/brand/nindo-hub-banner.jpg',
  loading: './assets/brand/nindo-loading.jpg',
  starterBg: './assets/brand/nindo-starter-bg.jpg',
};

/** Génération de la zone actuelle (combat / invocations). */
export function currentPlayGen(state) {
  return Number(getZone(state?.currentZone)?.gen) || 1;
}

export function pokemonGen(pokeOrId) {
  const id = typeof pokeOrId === 'object' ? pokeOrId?.speciesId : pokeOrId;
  return Number(getSpecies(id)?.generation) || 1;
}

export function isPokemonOfGen(poke, gen) {
  return pokemonGen(poke) === Number(gen);
}

export function ensureUnlockedGens(state) {
  if (!Array.isArray(state.unlockedGens) || !state.unlockedGens.length) {
    const fromZones = (state.unlockedZones || [])
      .map((id) => Number(getZone(id)?.gen) || 1);
    const max = Math.max(1, ...fromZones, pokemonGen(state.starterId || state.team?.[0]));
    state.unlockedGens = [];
    for (let g = 1; g <= max; g++) state.unlockedGens.push(g);
  }
  state.unlockedGens = [...new Set(state.unlockedGens.map(Number))].sort((a, b) => a - b);
  if (!state.unlockedGens.includes(1)) state.unlockedGens.unshift(1);
  return state.unlockedGens;
}

export function isGenUnlocked(state, gen) {
  ensureUnlockedGens(state);
  return state.unlockedGens.includes(Number(gen));
}

export function maxUnlockedGen(state) {
  ensureUnlockedGens(state);
  return Math.max(...state.unlockedGens);
}

/** Débloque une gen suivante (séquentielle) + offre un starter de cette gen. */
export function unlockGen(state, gen) {
  ensureUnlockedGens(state);
  const g = Number(gen);
  if (!g || g < 2 || g > 4) return { ok: false, reason: 'invalid' };
  if (state.unlockedGens.includes(g)) return { ok: false, reason: 'already' };
  if (g !== maxUnlockedGen(state) + 1) return { ok: false, reason: 'order' };

  state.unlockedGens.push(g);
  state.unlockedGens.sort((a, b) => a - b);

  const starterIds = ALL_STARTERS[g] || STARTERS;
  const sid = starterIds[Math.floor(Math.random() * starterIds.length)] || starterIds[0];
  const gift = createPokemon(sid, 5);
  state.caught[sid] = true;
  state.seen[sid] = true;
  if (state.team.length < 6) state.team.push(gift);
  else state.box.push(gift);

  const meta = GEN_META[g] || { name: `Saga ${g}`, roman: String(g) };
  addLog(
    state,
    `Saga ${meta.roman} (${meta.name}) débloquée ! ${pokeName(gift)} rejoint l'escouade.`,
    'unlock'
  );
  return { ok: true, gen: g, pokemon: gift, meta };
}

export function createNewGame(starterId) {
  const sp = getSpecies(starterId);
  const starterGen = Number(sp?.generation) || 1;
  // Nouvelle partie : Gen 1 uniquement (les gens suivantes se débloquent en jeu)
  const safeId = starterGen === 1 ? starterId : STARTERS[0];
  const starter = createPokemon(safeId, 5);
  const state = {
    version: 3,
    playerName: 'Ninja',
    starterId: safeId,
    money: 600,
    balls: { pokeball: 10, greatball: 1, ultraball: 0, masterball: 0 },
    team: [starter],
    box: [],
    seen: { [safeId]: true },
    caught: { [safeId]: true },
    unlockedZones: [ZONES[0].id],
    currentZone: ZONES[0].id,
    unlockedGens: [1],
    autoCatch: false,
    autoCatchBall: 'pokeball',
    battleSpeed: 1,
    settings: { mute: false, navExpanded: false },
    tutorialDone: false,
    ascensionLevel: 0,
    stats: { battles: 0, catches: 0, moneyEarned: 0, playTime: 0 },
    lastTick: Date.now(),
    startedAt: Date.now(),
    log: [],
    daily: null,
    dailyBaselines: null,
    summon: null,
    expeditions: [],
    daycare: [],
    badges: {},
    arenaWins: 0,
    minigame: { playsToday: 0, day: null, best: 0 },
  };
  initDailyBaselines(state);
  ensureSummon(state);
  ensureExpeditions(state);
  ensureDaycare(state);
  ensureArena(state);
  ensureUnlockedGens(state);
  return state;
}

export function busyPokemonUids(state) {
  const set = expeditionBusyUids(state);
  for (const u of daycareBusyUids(state)) set.add(u);
  return set;
}

export function isPokemonBusy(state, uid) {
  return busyPokemonUids(state).has(uid);
}

export function getZone(id) {
  return ZONES.find((z) => z.id === id);
}

export function saveGame(state) {
  state.lastTick = Date.now();
  state.version = 3;
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      for (const k of SAVE_KEY_LEGACY) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
    }
    if (!raw) return null;
    const state = JSON.parse(raw);
    state.version = 3;
    if (!state.playerName) state.playerName = 'Ninja';
    if (!state.starterId) state.starterId = state.team?.[0]?.speciesId || STARTERS[0];
    if (!state.balls) state.balls = { pokeball: 10, greatball: 0, ultraball: 0, masterball: 0 };
    if (!state.balls.masterball) state.balls.masterball = 0;
    if (!state.box) state.box = [];
    if (!state.stats) state.stats = { battles: 0, catches: 0, moneyEarned: 0, playTime: 0 };
    if (!state.log) state.log = [];
    if (!state.settings) state.settings = { mute: false, navExpanded: false };
    if (typeof state.settings.mute !== 'boolean') state.settings.mute = false;
    if (typeof state.settings.navExpanded !== 'boolean') state.settings.navExpanded = false;
    if (typeof state.tutorialDone !== 'boolean') state.tutorialDone = true;
    if (typeof state.ascensionLevel !== 'number') state.ascensionLevel = 0;
    ensureExpeditions(state);
    ensureDaycare(state);
    ensureArena(state);
    ensureUnlockedGens(state);
    if (!state.minigame) state.minigame = { playsToday: 0, day: null, best: 0 };
    if (state.autoCatchBall === 'masterball') state.autoCatchBall = 'pokeball';
    initDailyBaselines(state);
    ensureDaily(state);
    ensureSummon(state);
    // Ensure current zone still exists
    if (!getZone(state.currentZone)) {
      state.currentZone = ZONES[0].id;
      if (!state.unlockedZones) state.unlockedZones = [];
      if (!state.unlockedZones.includes(ZONES[0].id)) state.unlockedZones.push(ZONES[0].id);
    }
    for (const p of [...(state.team || []), ...(state.box || [])]) {
      if (!getSpecies(p.speciesId)) continue;
      refreshStats(p);
    }
    // Drop invalid pokemon (shouldn't happen)
    state.team = (state.team || []).filter((p) => getSpecies(p.speciesId));
    state.box = (state.box || []).filter((p) => getSpecies(p.speciesId));
    if (!state.team.length) {
      state.team = [createPokemon(STARTERS[0], 5)];
    }
    saveGame(state);
    return state;
  } catch {
    return null;
  }
}

export function hasSave() {
  if (localStorage.getItem(SAVE_KEY)) return true;
  return SAVE_KEY_LEGACY.some((k) => !!localStorage.getItem(k));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
  for (const k of SAVE_KEY_LEGACY) localStorage.removeItem(k);
}

export { addLog };

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function speciesPower(sp) {
  if (!sp) return 400;
  return (sp.hp || 0) + (sp.atk || 0) + (sp.def || 0) + (sp.spa || 0) + (sp.spd || 0) + (sp.spe || 0);
}

/** Tirage pondéré : formes trop fortes apparaissent rarement hors featured/rare. */
function pickWeightedWild(ids, zoneMaxLevel) {
  const entries = ids
    .map((id) => {
      const sp = getSpecies(id);
      if (!sp) return null;
      const power = speciesPower(sp);
      // Plus la forme est forte, moins elle spawn (sauf zones haut niveau)
      let w = 1000 / Math.max(220, power);
      if (power > 580 && zoneMaxLevel < 40) w *= 0.15;
      if (power > 640 && zoneMaxLevel < 50) w *= 0.2;
      if (power > 680) w *= 0.35;
      return { id, w };
    })
    .filter(Boolean);
  if (!entries.length) return 14;
  const total = entries.reduce((a, e) => a + e.w, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.w;
    if (roll <= 0) return e.id;
  }
  return entries[entries.length - 1].id;
}

export function spawnWild(state) {
  const zone = getZone(state.currentZone) || ZONES[0];
  const zoneGen = Number(zone.gen) || 1;
  const featured = (zone.pokemon || []).filter((id) => {
    const sp = getSpecies(id);
    return sp && (Number(sp.generation) || 1) === zoneGen;
  });
  // Pool : featured ×3 + shinobi « raisonnables » de la saga
  const genPool = allSpecies()
    .filter((s) => (Number(s.generation) || 1) === zoneGen)
    .filter((s) => speciesPower(s) <= 620 || zone.maxLevel >= 45)
    .map((s) => s.id);
  const pool = featured.length
    ? [...featured, ...featured, ...featured, ...genPool]
    : genPool.length
      ? genPool
      : zone.pokemon;
  let speciesId = pickWeightedWild(pool.length ? pool : [14], zone.maxLevel || 20);
  if (zone.rare?.length) {
    for (const r of zone.rare) {
      const sp = getSpecies(r.id);
      if (!sp || (Number(sp.generation) || 1) !== zoneGen) continue;
      if (Math.random() < r.chance) {
        speciesId = r.id;
        break;
      }
    }
  }
  if (!getSpecies(speciesId)) speciesId = featured.find((id) => getSpecies(id)) || genPool[0] || 14;
  const level =
    zone.minLevel + Math.floor(Math.random() * (zone.maxLevel - zone.minLevel + 1));
  const shinyRate = (1 / 8192) * rewardMults(state).shiny;
  const wild = createPokemon(speciesId, level, { shinyRate });
  state.seen[speciesId] = true;
  if (zone.rare?.some((r) => r.id === speciesId)) {
    addLog(state, `Rencontre rare : ${displayName(getSpecies(speciesId))} !`, 'unlock');
  }
  return wild;
}

export function activeFighter(state) {
  const busy = busyPokemonUids(state);
  const gen = currentPlayGen(state);
  return (
    state.team.find((p) => p.hp > 0 && !busy.has(p.uid) && isPokemonOfGen(p, gen)) || null
  );
}

/** Soin automatique uniquement (wipe / plus de combattant) — plus d’infirmerie manuelle. */
export function healTeam(state) {
  for (const p of state.team) {
    refreshStats(p);
    p.hp = p.maxHp;
  }
  addLog(state, 'L’escouade se relève…', 'heal');
}

export function unlockZone(state, zoneId) {
  const zone = getZone(zoneId);
  if (!zone || state.unlockedZones.includes(zoneId)) return { ok: false, reason: 'unavailable' };
  if (!isGenUnlocked(state, zone.gen || 1)) return { ok: false, reason: 'gen-locked', gen: zone.gen };
  if (state.money < zone.unlockCost) return { ok: false, reason: 'no-money', need: zone.unlockCost };
  state.money -= zone.unlockCost;
  state.unlockedZones.push(zoneId);
  addLog(state, `Zone débloquée : ${zone.name} !`, 'unlock');
  tryAwardRegionBadge(state, zone);
  return { ok: true, zone };
}

export function setZone(state, zoneId) {
  if (!state.unlockedZones.includes(zoneId)) return false;
  const zone = getZone(zoneId);
  if (zone && !isGenUnlocked(state, zone.gen || 1)) return false;
  state.currentZone = zoneId;
  return true;
}

export function buyBall(state, ballId, qty = 1) {
  const ball = BALLS[ballId];
  if (!ball) return false;
  const cost = ball.price * qty;
  if (state.money < cost) return false;
  state.money -= cost;
  state.balls[ballId] = (state.balls[ballId] || 0) + qty;
  addLog(state, `Acheté ${qty}× ${ball.name}.`, 'shop');
  return true;
}

export function moveToBox(state, uid) {
  const idx = state.team.findIndex((p) => p.uid === uid);
  if (idx < 0 || state.team.length <= 1) return false;
  const [p] = state.team.splice(idx, 1);
  state.box.push(p);
  return true;
}

export function moveToTeam(state, uid) {
  if (state.team.length >= 6) return false;
  const idx = state.box.findIndex((p) => p.uid === uid);
  if (idx < 0) return false;
  const [p] = state.box.splice(idx, 1);
  state.team.push(p);
  return true;
}

export function swapTeam(state, a, b) {
  if (a < 0 || b < 0 || a >= state.team.length || b >= state.team.length) return;
  [state.team[a], state.team[b]] = [state.team[b], state.team[a]];
}

export function tryEvolvePokemon(state, uid) {
  const poke = [...state.team, ...state.box].find((p) => p.uid === uid);
  if (!poke || !canEvolve(poke)) return null;
  const oldName = pokeName(poke);
  const neu = evolve(poke);
  if (!neu) return null;
  state.caught[neu.id] = true;
  state.seen[neu.id] = true;
  addLog(state, `${oldName} progresse en ${displayName(neu)} !`, 'evolve');
  return neu;
}

export function autoEvolveAll(state) {
  let count = 0;
  for (const p of [...state.team, ...state.box]) {
    let guard = 0;
    while (canEvolve(p) && guard++ < 5) {
      tryEvolvePokemon(state, p.uid);
      count++;
    }
  }
  return count;
}

/** Crée un duel 1v1 (seul le 1er vivant de l’équipe combat) */
export function createBattle(state) {
  if (!activeFighter(state)) healTeam(state);
  const wild = spawnWild(state);
  const fighter = activeFighter(state);
  return {
    wild,
    turn: 0,
    over: false,
    result: null,
    nextActor: (fighter?.spe ?? 0) >= wild.spe ? 'player' : 'wild',
    lastFloat: null, // { side, text, kind }
    lastLabel: null, // super efficace / pas très efficace / aucun effet
    lastAttack: null,
  };
}

function floatKind(typeMult) {
  if (typeMult === 0) return 'immune';
  if (typeMult >= 2) return 'super';
  if (typeMult > 0 && typeMult < 1) return 'resist';
  return 'normal';
}

function awardKo(state, battle, fighter, wild, events) {
  const mults = rewardMults(state);
  const xp = Math.max(1, Math.floor(xpFromWild(wild, fighter.level) * mults.xp));
  const money = Math.max(1, Math.floor(moneyFromWild(wild) * mults.money));
  const levelInfo = gainXp(fighter, xp);
  state.money += money;
  state.stats.battles++;
  state.stats.moneyEarned += money;
  events.push({
    type: 'win',
    xp,
    money,
    levelInfo,
    fighter: pokeName(fighter),
    wildName: pokeName(wild),
    shiny: wild.shiny,
  });
  if (levelInfo.leveled) {
    events.push({ type: 'levelup', newLevel: levelInfo.newLevel });
  }
  addLog(
    state,
    `${pokeName(fighter)} bat ${pokeName(wild)} (+${xp} XP, ${money}両)`,
    'battle'
  );
  if (levelInfo.leveled) {
    addLog(state, `${pokeName(fighter)} monte au N.${levelInfo.newLevel} !`, 'level');
  }
  battle.over = true;
  battle.result = 'win';
}

/**
 * Duel 1v1 tour par tour : un tick = une attaque.
 * Attaquant / défenseur clairs ; XP & argent uniquement après KO (pas de capture sur KO).
 */
export function battleTick(state, battle) {
  if (battle.over) return [];
  const events = [];
  let fighter = activeFighter(state);
  if (!fighter) {
    battle.over = true;
    battle.result = 'lose';
    events.push({ type: 'lose' });
    healTeam(state);
    return events;
  }

  const wild = battle.wild;
  if (wild.hp <= 0) {
    awardKo(state, battle, fighter, wild, events);
    return events;
  }

  battle.turn++;
  const who = battle.nextActor || ((fighter.spe >= wild.spe ? 'player' : 'wild'));
  const atk = who === 'player' ? fighter : wild;
  const def = who === 'player' ? wild : fighter;

  const hit = calcDamage(atk, def);
  def.hp = Math.max(0, def.hp - hit.damage);

  battle.lastFloat = {
    side: who === 'player' ? 'enemy' : 'ally',
    text: hit.damage === 0 ? '0' : `-${hit.damage}`,
    kind: floatKind(hit.typeMult),
  };
  battle.lastLabel = hit.label || null;
  battle.lastAttack = {
    who,
    attacker: pokeName(atk),
    defender: pokeName(def),
    damage: hit.damage,
    typeMult: hit.typeMult,
    label: hit.label,
  };

  events.push({
    type: 'attack',
    who,
    attacker: pokeName(atk),
    defender: pokeName(def),
    damage: hit.damage,
    typeMult: hit.typeMult,
    label: hit.label,
    hpLeft: def.hp,
    maxHp: def.maxHp,
  });

  if (hit.label) {
    events.push({ type: 'effectiveness', text: hit.label, typeMult: hit.typeMult });
    // Journal : seulement super / immunité (évite le spam qui fait « clignoter » l’UI)
    if (hit.typeMult === 0 || hit.typeMult >= 2) {
      addLog(state, `${pokeName(atk)} → ${pokeName(def)} : ${hit.label}`, hit.typeMult >= 2 ? 'level' : 'info');
    }
  }

  if (def.hp <= 0) {
    if (who === 'player') {
      awardKo(state, battle, fighter, wild, events);
    } else {
      events.push({ type: 'faint', name: pokeName(fighter) });
      addLog(state, `${pokeName(fighter)} est K.O. !`, 'faint');
      fighter = activeFighter(state);
      if (!fighter) {
        battle.over = true;
        battle.result = 'lose';
        events.push({ type: 'lose' });
        healTeam(state);
      } else {
        battle.nextActor = 'player';
        addLog(state, `${pokeName(fighter)} entre au combat !`, 'battle');
      }
    }
  } else {
    battle.nextActor = who === 'player' ? 'wild' : 'player';
  }

  return events;
}

export function attemptCatch(state, battle, ballId = 'pokeball') {
  if (battle.over || battle.wild.hp <= 0) return { ok: false, reason: 'unavailable' };
  if ((state.balls[ballId] || 0) <= 0) return { ok: false, reason: 'no-ball' };

  state.balls[ballId]--;
  const ball = BALLS[ballId];
  const bonus = ball?.bonus ?? 1;
  // Sceau des Cinq Kage : très fort (plafond 92%), plus de 100% auto
  let chance = catchChance(battle.wild, bonus);
  // Sceau Kage : très fiable mais pas garanti (78–88 %)
  if (ballId === 'masterball') chance = Math.min(0.88, Math.max(chance, 0.78));
  const success = Math.random() < chance;

  if (success) {
    const caught = createPokemon(battle.wild.speciesId, battle.wild.level, {
      iv: battle.wild.iv,
      shiny: battle.wild.shiny,
      xp: battle.wild.xp,
    });
    state.caught[caught.speciesId] = true;
    state.seen[caught.speciesId] = true;
    state.stats.catches++;
    if (state.team.length < 6) state.team.push(caught);
    else state.box.push(caught);

    const fighter = activeFighter(state);
    const mults = rewardMults(state);
    if (fighter) {
      const xp = Math.floor(xpFromWild(battle.wild, fighter.level) * 0.5 * mults.xp);
      const money = Math.floor(moneyFromWild(battle.wild) * 0.5 * mults.money);
      gainXp(fighter, xp);
      state.money += money;
      state.stats.moneyEarned += money;
    }

    battle.over = true;
    battle.result = 'catch';
    addLog(
      state,
      `Scellé ${pokeName(caught)}${caught.shiny ? ' (aura rare)' : ''} avec ${ball.name} !`,
      'catch'
    );
    return { ok: true, success: true, pokemon: caught, chance, ball };
  }

  addLog(state, `${ball.name} a échoué… (${Math.round(chance * 100)}%)`, 'miss');
  return { ok: true, success: false, chance, ball };
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsed = Math.min(now - (state.lastTick || now), 1000 * 60 * 60 * 6);
  state.lastTick = now;
  if (elapsed < 15000) return null;

  const seconds = Math.floor(elapsed / 1000);
  const battles = Math.floor(seconds / 8);
  if (battles <= 0) return null;

  let xpGain = 0;
  let moneyGain = 0;
  let catches = 0;
  const fighter = activeFighter(state) || state.team[0];
  if (!fighter) return null;

  const zone = getZone(state.currentZone) || ZONES[0];
  const mults = rewardMults(state);
  for (let i = 0; i < Math.min(battles, 800); i++) {
    const sid = zone.pokemon[i % zone.pokemon.length];
    if (!getSpecies(sid)) continue;
    const lvl = Math.floor((zone.minLevel + zone.maxLevel) / 2);
    const fake = createPokemon(sid, lvl, { shiny: false });
    xpGain += Math.floor(xpFromWild(fake, fighter.level) * mults.xp);
    moneyGain += Math.floor(moneyFromWild(fake) * mults.money);
    if (state.autoCatch && (state.balls.pokeball || 0) > 0 && Math.random() < 0.06) {
      state.balls.pokeball--;
      const c = createPokemon(sid, lvl);
      state.caught[sid] = true;
      state.seen[sid] = true;
      if (state.team.length < 6) state.team.push(c);
      else state.box.push(c);
      catches++;
      state.stats.catches++;
    }
  }

  gainXp(fighter, xpGain);
  state.money += moneyGain;
  state.stats.battles += battles;
  state.stats.moneyEarned += moneyGain;
  state.stats.playTime += seconds;
  addLog(
    state,
    `Hors-ligne : ~${battles} combats, +${xpGain} XP, +${moneyGain}両` +
      (catches ? `, ${catches} captures` : ''),
    'offline'
  );
  return { battles, xpGain, moneyGain, catches, seconds };
}

export {
  ZONES,
  STARTERS,
  ALL_STARTERS,
  artUrl,
  getSpecies,
  displayName,
  pokeName,
  canEvolve,
  speciesCount,
  allSpecies,
};
