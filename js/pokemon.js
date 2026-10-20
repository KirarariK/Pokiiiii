import { typeEffectiveness } from './data/types.js';

const ART = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const SPRITE = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

let SPECIES = [];
const byId = new Map();

export async function loadSpecies() {
  const res = await fetch('./js/data/pokemon-gen1.json');
  SPECIES = await res.json();
  byId.clear();
  for (const s of SPECIES) byId.set(s.id, s);
  return SPECIES;
}

export function getSpecies(id) {
  return byId.get(id);
}

export function allSpecies() {
  return SPECIES;
}

export function artUrl(id) {
  return ART(id);
}

export function spriteUrl(id) {
  return SPRITE(id);
}

export function displayName(species) {
  return species.nameFr || capitalize(species.name);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Formule stats Gen I/II simplifiée */
export function calcStat(base, level, iv = 15) {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

export function calcHP(base, level, iv = 15) {
  return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
}

export function xpForLevel(level) {
  // Medium Fast
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

export function canEvolve(poke) {
  const sp = getSpecies(poke.speciesId);
  if (!sp?.evolvesTo) return false;
  return poke.level >= sp.evolvesTo.level;
}

export function evolve(poke) {
  const sp = getSpecies(poke.speciesId);
  if (!canEvolve(poke)) return null;
  const ratio = poke.hp / poke.maxHp;
  poke.speciesId = sp.evolvesTo.to;
  refreshStats(poke);
  poke.hp = Math.max(1, Math.floor(poke.maxHp * ratio));
  return getSpecies(poke.speciesId);
}

/** Dégâts simplifiés (attaque physique) */
export function calcDamage(attacker, defender, power = 50) {
  const atkSp = getSpecies(attacker.speciesId);
  const defSp = getSpecies(defender.speciesId);
  const atkStat = attacker.atk;
  const defStat = defender.def;
  const stab = atkSp.types.includes(atkSp.types[0]) ? 1.5 : 1.5; // always STAB on primary
  const typeMult = typeEffectiveness(atkSp.types[0], defSp.types);
  const random = 0.85 + Math.random() * 0.15;
  const base =
    (((2 * attacker.level) / 5 + 2) * power * (atkStat / Math.max(1, defStat))) / 50 + 2;
  const dmg = Math.max(1, Math.floor(base * stab * typeMult * random));
  return { damage: dmg, typeMult, stab };
}

export function catchChance(wild, ballBonus = 1) {
  const sp = getSpecies(wild.speciesId);
  const rate = sp.captureRate || 45;
  const hpFactor = Math.max(0.1, wild.hp / wild.maxHp);
  // Plus bas HP = meilleure chance
  const a = ((3 * wild.maxHp - 2 * wild.hp) * rate * ballBonus) / (3 * wild.maxHp);
  const chance = Math.min(0.95, Math.max(0.05, a / 255));
  return chance * (1.15 - hpFactor * 0.4);
}

export function tryCatch(wild, ballBonus = 1) {
  const chance = catchChance(wild, ballBonus);
  return Math.random() < chance;
}

export function moneyFromWild(wild) {
  const sp = getSpecies(wild.speciesId);
  return Math.floor((sp.baseExp / 3 + wild.level * 2) * (0.8 + Math.random() * 0.4));
}

export function xpFromWild(wild, winnerLevel) {
  const sp = getSpecies(wild.speciesId);
  const base = Math.floor((sp.baseExp * wild.level) / 7);
  // Pénalité si trop haut niveau
  const diff = Math.max(0, winnerLevel - wild.level);
  const scale = Math.max(0.25, 1 - diff * 0.05);
  return Math.max(1, Math.floor(base * scale));
}
