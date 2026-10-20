import { typeEffectiveness } from './data/types.js';

function fallbackArt(id, name = '?') {
  const label = encodeURIComponent(String(name).slice(0, 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c2d12"/><stop offset="50%" stop-color="#ea580c"/><stop offset="100%" stop-color="#111827"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <circle cx="256" cy="200" r="110" fill="none" stroke="#fde68a" stroke-width="10"/>
    <path d="M140 200h232M256 90v220" stroke="#fde68a" stroke-width="8"/>
    <text x="256" y="400" text-anchor="middle" fill="#fff7ed" font-family="sans-serif" font-size="36" font-weight="700">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${svg.replace(/#/g, '%23').replace(/\n/g, '')}`;
}

let SPECIES = [];
const byId = new Map();

export async function loadSpecies() {
  const sources = ['./js/data/shinobi-all.json', './js/data/pokemon-all.json'];
  let lastErr;
  for (const url of sources) {
    try {
      const ctrl = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
        ? AbortSignal.timeout(15000)
        : undefined;
      const res = await fetch(url, ctrl ? { signal: ctrl } : undefined);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`Empty species list from ${url}`);
      }
      SPECIES = data;
      byId.clear();
      for (const s of SPECIES) byId.set(s.id, s);
      return SPECIES;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Impossible de charger les shinobi');
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

/** Artwork AniList HQ (image) — fallback SVG thématique. */
export function artUrl(id) {
  const s = byId.get(Number(id));
  if (s?.image) return s.image;
  return fallbackArt(id, s?.nameFr || s?.name || id);
}

export function spriteUrl(id) {
  return artUrl(id);
}

export function displayName(species) {
  if (!species) return '???';
  return species.nameFr || species.baseName || capitalize(species.name);
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
  const shinyRate = opts.shinyRate ?? 1 / 4096;
  const shiny = opts.shiny ?? Math.random() < shinyRate;
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

/**
 * Dégâts 1v1 — physique + STAB léger + types.
 * Soft-cap anti one-shot : max ~33% PV / coup (~38% si super efficace).
 */
export function calcDamage(attacker, defender, power = 46) {
  const atkSp = getSpecies(attacker.speciesId);
  const defSp = getSpecies(defender.speciesId);
  if (!atkSp || !defSp) {
    return { damage: 0, typeMult: 0, stab: 1, atkType: null, label: effectivenessLabel(0) };
  }
  const atkType = atkSp.types[0];
  const stab = atkSp.types.includes(atkType) ? 1.25 : 1;
  let typeMult = typeEffectiveness(atkType, defSp.types);
  // Évite les cascades 4× trop brutales
  typeMult = Math.min(2, Math.max(0, typeMult));
  if (typeMult === 0) {
    return { damage: 0, typeMult, stab, atkType, label: effectivenessLabel(0) };
  }
  const random = 0.85 + Math.random() * 0.15;
  // Blend atk/spa pour ne pas rendre les builds spa inutiles
  const offense = attacker.atk * 0.7 + (attacker.spa || attacker.atk) * 0.3;
  const defense = Math.max(1, defender.def * 0.7 + (defender.spd || defender.def) * 0.3);
  const base =
    (((2 * attacker.level) / 5 + 2) * power * (offense / defense)) / 50 + 2;
  let dmg = Math.max(1, Math.floor(base * stab * typeMult * random));

  const maxHp = Math.max(1, defender.maxHp || 1);
  const softCap = Math.floor(maxHp * (typeMult >= 2 ? 0.38 : 0.32));
  if (dmg > softCap) dmg = softCap;
  // Écart de niveau : un ninja nettement plus faible ne one-shot pas
  const lvlGap = (attacker.level || 1) - (defender.level || 1);
  if (lvlGap < -8) dmg = Math.max(1, Math.floor(dmg * 0.6));
  if (lvlGap > 10) dmg = Math.min(dmg, Math.floor(maxHp * 0.45));
  // Écart de puissance (BST) : un dieu n’écrase pas un genin en 2 coups
  const atkBst =
    (atkSp.hp || 0) +
    (atkSp.atk || 0) +
    (atkSp.def || 0) +
    (atkSp.spa || 0) +
    (atkSp.spd || 0) +
    (atkSp.spe || 0);
  const defBst =
    (defSp.hp || 0) +
    (defSp.atk || 0) +
    (defSp.def || 0) +
    (defSp.spa || 0) +
    (defSp.spd || 0) +
    (defSp.spe || 0);
  if (atkBst - defBst > 180) {
    dmg = Math.min(dmg, Math.floor(maxHp * 0.28));
  }

  return {
    damage: Math.max(1, dmg),
    typeMult,
    stab,
    atkType,
    label: effectivenessLabel(typeMult),
  };
}

/**
 * Chance de sceau — courbe exigeante mais juste.
 * - PV hauts : très faible (faut affaiblir)
 * - PV bas : récompense, plafonnée (pas de free catch)
 * ballBonus : 1 / 1.45 / 1.9 / 4.5
 */
export function catchChance(wild, ballBonus = 1) {
  const sp = getSpecies(wild.speciesId);
  const rate = Number(sp?.captureRate) || 45;
  const hpPct = Math.max(0.01, Math.min(1, wild.hp / Math.max(1, wild.maxHp)));
  // Formule style « affaiblir d’abord »
  const a = ((3 - 2 * hpPct) * rate * ballBonus) / 3;
  let chance = a / 255;
  // Bonus léger si vraiment affaibli (gameplay gratifiant, pas broken)
  if (hpPct <= 0.15) chance *= 1.22;
  else if (hpPct <= 0.25) chance *= 1.1;
  // Malus formes avancées (BST élevé)
  const bst =
    (sp?.hp || 0) +
    (sp?.atk || 0) +
    (sp?.def || 0) +
    (sp?.spa || 0) +
    (sp?.spd || 0) +
    (sp?.spe || 0);
  if (bst >= 650) chance *= 0.62;
  else if (bst >= 580) chance *= 0.75;
  else if (bst >= 500) chance *= 0.88;
  // Niveau adversaire
  const lvl = wild.level || 1;
  if (lvl >= 35) chance *= 0.9;
  if (lvl >= 50) chance *= 0.82;

  chance = Math.max(0.018, Math.min(0.68, chance));
  return chance;
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
  const base = Math.floor((baseExp * wild.level) / 7.5);
  const diff = Math.max(0, (winnerLevel || 1) - (wild.level || 1));
  // Farming sur plus faibles : XP fortement réduite
  const scale = Math.max(0.12, 1 - diff * 0.07);
  return Math.max(1, Math.floor(base * scale));
}
