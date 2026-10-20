import { ZONES, STARTERS } from './data/zones.js';
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
} from './pokemon.js';

const SAVE_KEY = 'pokeidle_fan_save_v1';

export const BALLS = {
  pokeball: { id: 'pokeball', name: 'Poké Ball', bonus: 1, price: 200, emoji: '🔴' },
  greatball: { id: 'greatball', name: 'Super Ball', bonus: 1.5, price: 600, emoji: '🔵' },
  ultraball: { id: 'ultraball', name: 'Hyper Ball', bonus: 2, price: 1200, emoji: '🟡' },
};

export function createNewGame(starterId) {
  const starter = createPokemon(starterId, 5);
  return {
    version: 1,
    money: 500,
    balls: { pokeball: 10, greatball: 0, ultraball: 0 },
    team: [starter],
    box: [],
    seen: { [starterId]: true },
    caught: { [starterId]: true },
    unlockedZones: ['route1'],
    currentZone: 'route1',
    autoCatch: false,
    autoCatchBall: 'pokeball',
    battleSpeed: 1,
    stats: {
      battles: 0,
      catches: 0,
      moneyEarned: 0,
      playTime: 0,
    },
    lastTick: Date.now(),
    startedAt: Date.now(),
    log: [],
  };
}

export function getZone(id) {
  return ZONES.find((z) => z.id === id);
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function saveGame(state) {
  state.lastTick = Date.now();
  localStorage.setItem(SAVE_KEY, serialize(state));
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    for (const p of [...state.team, ...state.box]) refreshStats(p);
    return state;
  } catch {
    return null;
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

export function addLog(state, msg, type = 'info') {
  state.log.unshift({ msg, type, t: Date.now() });
  if (state.log.length > 80) state.log.length = 80;
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function spawnWild(state) {
  const zone = getZone(state.currentZone);
  let speciesId = randomFrom(zone.pokemon);
  if (zone.rare?.length) {
    for (const r of zone.rare) {
      if (Math.random() < r.chance) {
        speciesId = r.id;
        break;
      }
    }
  }
  const level =
    zone.minLevel + Math.floor(Math.random() * (zone.maxLevel - zone.minLevel + 1));
  const wild = createPokemon(speciesId, level);
  state.seen[speciesId] = true;
  if (zone.rare?.some((r) => r.id === speciesId)) {
    addLog(state, `Rencontre rare : ${displayName(getSpecies(speciesId))} !`, 'unlock');
  }
  return wild;
}

export function activeFighter(state) {
  return state.team.find((p) => p.hp > 0) || null;
}

export function healTeam(state) {
  for (const p of state.team) {
    refreshStats(p);
    p.hp = p.maxHp;
  }
  addLog(state, 'Votre équipe a été soignée au Centre Pokémon.', 'heal');
}

export function unlockZone(state, zoneId) {
  const zone = getZone(zoneId);
  if (!zone || state.unlockedZones.includes(zoneId)) return false;
  if (state.money < zone.unlockCost) return false;
  state.money -= zone.unlockCost;
  state.unlockedZones.push(zoneId);
  addLog(state, `Zone débloquée : ${zone.name} !`, 'unlock');
  return true;
}

export function setZone(state, zoneId) {
  if (!state.unlockedZones.includes(zoneId)) return false;
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
  state.caught[neu.id] = true;
  state.seen[neu.id] = true;
  addLog(state, `${oldName} évolue en ${displayName(neu)} !`, 'evolve');
  return neu;
}

export function autoEvolveAll(state) {
  let count = 0;
  for (const p of [...state.team, ...state.box]) {
    while (canEvolve(p)) {
      tryEvolvePokemon(state, p.uid);
      count++;
    }
  }
  return count;
}

/**
 * Combat automatique : un « tick » de bataille
 * Retourne des événements pour l'UI
 */
export function createBattle(state) {
  const fighter = activeFighter(state);
  if (!fighter) {
    healTeam(state);
  }
  return {
    wild: spawnWild(state),
    turn: 0,
    over: false,
    result: null, // win | lose | catch | flee
  };
}

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
  battle.turn++;

  // Joueur attaque
  const playerFirst = fighter.spe >= wild.spe;
  const actors = playerFirst
    ? [
        ['player', fighter, wild],
        ['wild', wild, fighter],
      ]
    : [
        ['wild', wild, fighter],
        ['player', fighter, wild],
      ];

  for (const [who, atk, def] of actors) {
    if (battle.over) break;
    if (atk.hp <= 0 || def.hp <= 0) continue;

    const { damage, typeMult } = calcDamage(atk, def);
    def.hp = Math.max(0, def.hp - damage);
    events.push({
      type: 'attack',
      who,
      attacker: pokeName(atk),
      defender: pokeName(def),
      damage,
      typeMult,
      hpLeft: def.hp,
      maxHp: def.maxHp,
    });

    if (def.hp <= 0) {
      if (who === 'player') {
        // Victoire
        const xp = xpFromWild(wild, fighter.level);
        const money = moneyFromWild(wild);
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
        addLog(
          state,
          `${pokeName(fighter)} bat ${pokeName(wild)} (+${xp} XP, ${money}₽)`,
          'battle'
        );
        if (levelInfo.leveled) {
          addLog(state, `${pokeName(fighter)} monte au N.${levelInfo.newLevel} !`, 'level');
        }

        // Auto-capture si activé et balls dispo
        if (state.autoCatch) {
          const ballId = state.autoCatchBall;
          if ((state.balls[ballId] || 0) > 0) {
            // On ne peut plus capturer un KO — spawn déjà KO. Skip auto on KO.
          }
        }

        battle.over = true;
        battle.result = 'win';
      } else {
        events.push({ type: 'faint', name: pokeName(fighter) });
        addLog(state, `${pokeName(fighter)} est K.O. !`, 'faint');
        fighter = activeFighter(state);
        if (!fighter) {
          battle.over = true;
          battle.result = 'lose';
          events.push({ type: 'lose' });
          healTeam(state);
        }
      }
    }
  }

  return events;
}

/** Tentative de capture pendant le combat (wild encore vivant) */
export function attemptCatch(state, battle, ballId = 'pokeball') {
  if (battle.over || battle.wild.hp <= 0) return { ok: false, reason: 'unavailable' };
  if ((state.balls[ballId] || 0) <= 0) return { ok: false, reason: 'no-ball' };

  state.balls[ballId]--;
  const ball = BALLS[ballId];
  const success = tryCatch(battle.wild, ball.bonus);
  const chance = catchChance(battle.wild, ball.bonus);

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

    // XP consolation
    const fighter = activeFighter(state);
    if (fighter) {
      const xp = Math.floor(xpFromWild(battle.wild, fighter.level) * 0.5);
      const money = Math.floor(moneyFromWild(battle.wild) * 0.5);
      gainXp(fighter, xp);
      state.money += money;
    }

    battle.over = true;
    battle.result = 'catch';
    const name = pokeName(caught);
    addLog(
      state,
      `Capturé ${name}${caught.shiny ? ' ✨' : ''} avec ${ball.name} !`,
      'catch'
    );
    return { ok: true, success: true, pokemon: caught, chance, ball };
  }

  addLog(state, `${ball.name} a échoué… (${Math.round(chance * 100)}%)`, 'miss');
  return { ok: true, success: false, chance, ball };
}

export function applyOfflineProgress(state) {
  const now = Date.now();
  const elapsed = Math.min(now - (state.lastTick || now), 1000 * 60 * 60 * 4); // max 4h
  state.lastTick = now;
  if (elapsed < 15000) return null;

  const seconds = Math.floor(elapsed / 1000);
  const battles = Math.floor(seconds / 8); // ~1 combat / 8s offline
  if (battles <= 0) return null;

  let xpGain = 0;
  let moneyGain = 0;
  let catches = 0;
  const fighter = activeFighter(state) || state.team[0];
  if (!fighter) return null;

  const zone = getZone(state.currentZone);
  for (let i = 0; i < Math.min(battles, 500); i++) {
    const sid = zone.pokemon[i % zone.pokemon.length];
    const lvl = Math.floor((zone.minLevel + zone.maxLevel) / 2);
    const fake = createPokemon(sid, lvl);
    const xp = xpFromWild(fake, fighter.level);
    const money = moneyFromWild(fake);
    xpGain += xp;
    moneyGain += money;

    if (state.autoCatch && (state.balls.pokeball || 0) > 0 && Math.random() < 0.12) {
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
    `Hors-ligne : ~${battles} combats, +${xpGain} XP, +${moneyGain}₽` +
      (catches ? `, ${catches} captures` : ''),
    'offline'
  );

  return { battles, xpGain, moneyGain, catches, seconds };
}

export { ZONES, STARTERS, artUrl, getSpecies, displayName, pokeName, canEvolve };
