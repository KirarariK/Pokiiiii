import { typeEffectiveness } from './data/types.js';

const ART = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const SPRITE = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

let SPECIES = [];
const byId = new Map();

export async function loadSpecies() {
  const sources = ['./js/data/pokemon-all.json', './js/data/pokemon-gen1.json'];
  let lastErr;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      SPECIES = await res.json();
      byId.clear();
      for (const s of SPECIES) byId.set(s.id, s);
      return SPECIES;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Impossible de charger les espèces');
}

export function getSpecies(id) {
  return byId.get(id);
}

export function allSpecies() {
  return SPECIES;
}

export function speciesCount() {
  return SPECIES.length;
}

/** Toujours l’artwork PokeAPI par id national (pas de sprite local requis). */
export function artUrl(id) {
  return ART(Number(id));
}

export function spriteUrl(id) {
  return SPRITE(Number(id));
}

export function displayName(species) {
  if (!species) return '???';
  return species.nameFr || capitalize(species.name);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function calcStat(base, level, iv = 15) {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

export function calcHP(base, level, iv = 15) {
  return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
}

export function xpForLevel(level) {
  return level * level * level;
}

export function levelFromXp(xp) {
  let level = 1;
  while (level < 100 && xpForLevel(level + 1) <= xp) level++;
  return level;
}

let uidCounter = 1;

export function createPokemon(speciesId, level = 5, opts = {}) {
  const sp = getSpecies(speciesId);
  if (!sp) throw new Error('Unknown species ' + speciesId);
  const iv = opts.iv ?? Math.floor(Math.random() * 16);
  const shiny = opts.shiny ?? Math.random() < 1 / 4096;
  const xp = opts.xp ?? xpForLevel(level);
  const poke = {
    uid: opts.uid ?? `p${Date.now()}_${uidCounter++}`,
    speciesId,
    xp,
    level: levelFromXp(xp),
    iv,
    shiny,
    hp: 0,
    maxHp: 0,
    nickname: opts.nickname || null,
  };
  refreshStats(poke);
  poke.hp = poke.maxHp;
  return poke;
}

export function refreshStats(poke) {
  const sp = getSpecies(poke.speciesId);
  if (!sp) return;
  poke.level = levelFromXp(poke.xp);
  poke.maxHp = calcHP(sp.hp, poke.level, poke.iv);
  poke.atk = calcStat(sp.atk, poke.level, poke.iv);
  poke.def = calcStat(sp.def, poke.level, poke.iv);
  poke.spa = calcStat(sp.spa, poke.level, poke.iv);
  poke.spd = calcStat(sp.spd, poke.level, poke.iv);
  poke.spe = calcStat(sp.spe, poke.level, poke.iv);
  if (poke.hp > poke.maxHp) poke.hp = poke.maxHp;
}

export function pokeName(poke) {
  if (poke.nickname) return poke.nickname;
  return displayName(getSpecies(poke.speciesId));
}

export function gainXp(poke, amount) {
  const before = poke.level;
  poke.xp += amount;
  refreshStats(poke);
  const leveled = poke.level > before;
  if (leveled) poke.hp = poke.maxHp;
  return { leveled, newLevel: poke.level, levelsGained: poke.level - before };
}

/** Évolution niveau uniquement ; ignore evolvesTo manquant / invalide. */
export function canEvolve(poke) {
  const sp = getSpecies(poke.speciesId);
  const evo = sp?.evolvesTo;
  if (!evo || typeof evo !== 'object') return false;
  if (evo.to == null || !getSpecies(evo.to)) return false;
  if (typeof evo.level !== 'number') return false;
  return poke.level >= evo.level;
}

export function evolve(poke) {
  const sp = getSpecies(poke.speciesId);
  if (!canEvolve(poke)) return null;
  const next = getSpecies(sp.evolvesTo.to);
  if (!next) return null;
  const ratio = poke.maxHp > 0 ? poke.hp / poke.maxHp : 1;
  poke.speciesId = next.id;
  refreshStats(poke);
  poke.hp = Math.max(1, Math.floor(poke.maxHp * ratio));
  return next;
}

export function effectivenessLabel(mult) {
  if (mult === 0) return 'Aucun effet…';
  if (mult >= 2) return 'C’est super efficace !';
  if (mult > 0 && mult < 1) return 'Ce n’est pas très efficace…';
  return '';
}

/** Dégâts 1v1 — physique avec STAB + types */
export function calcDamage(attacker, defender, power = 55) {
  const atkSp = getSpecies(attacker.speciesId);
  const defSp = getSpecies(defender.speciesId);
  if (!atkSp || !defSp) {
    return { damage: 0, typeMult: 0, stab: 1, atkType: null, label: effectivenessLabel(0) };
  }
  const atkType = atkSp.types[0];
  const stab = atkSp.types.includes(atkType) ? 1.5 : 1;
  const typeMult = typeEffectiveness(atkType, defSp.types);
  if (typeMult === 0) {
    return { damage: 0, typeMult, stab, atkType, label: effectivenessLabel(0) };
  }
  const random = 0.85 + Math.random() * 0.15;
  const base =
    (((2 * attacker.level) / 5 + 2) * power * (attacker.atk / Math.max(1, defender.def))) /
      50 +
    2;
  const dmg = Math.max(1, Math.floor(base * stab * typeMult * random));
  return {
    damage: dmg,
    typeMult,
    stab,
    atkType,
    label: effectivenessLabel(typeMult),
  };
}

export function catchChance(wild, ballBonus = 1) {
  const sp = getSpecies(wild.speciesId);
  const rate = sp.captureRate || 45;
  const a =
    ((3 * wild.maxHp - 2 * wild.hp) * rate * ballBonus) / (3 * wild.maxHp);
  const raw = Math.min(0.95, Math.max(0.04, a / 255));
  const hpPct = wild.hp / wild.maxHp;
  return Math.min(0.98, raw * (1.2 - hpPct * 0.45));
}

export function tryCatch(wild, ballBonus = 1) {
  return Math.random() < catchChance(wild, ballBonus);
}

export function moneyFromWild(wild) {
  const sp = getSpecies(wild.speciesId);
  const baseExp = sp?.baseExp || 50;
  const genBonus = 1 + ((sp?.generation || 1) - 1) * 0.08;
  return Math.floor(
    (baseExp / 3 + wild.level * 2) * (0.8 + Math.random() * 0.4) * genBonus
  );
}

export function xpFromWild(wild, winnerLevel) {
  const sp = getSpecies(wild.speciesId);
  const baseExp = sp?.baseExp || 50;
  const base = Math.floor((baseExp * wild.level) / 7);
  const diff = Math.max(0, winnerLevel - wild.level);
  const scale = Math.max(0.2, 1 - diff * 0.05);
  return Math.max(1, Math.floor(base * scale));
}
