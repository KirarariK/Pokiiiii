// Aléa.
// - Les tirages de cartes utilisent le générateur cryptographique du navigateur.
//   En production, le tirage doit être fait côté serveur par un générateur certifié :
//   un tirage côté client est falsifiable et ne vaut que pour la démonstration.
// - Les contenus simulés (flux d'activité, classement) utilisent un générateur
//   déterministe à graine, pour rester stables d'un rechargement à l'autre.

/** Entier uniforme dans [0, n), sans biais de modulo. */
export function randInt(n) {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError('randInt: n doit être un entier > 0');
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % n;
}

/**
 * Tire un élément selon des poids entiers (ex. probabilités en millièmes).
 * @template T
 * @param {T[]} items
 * @param {(item: T) => number} weightOf  poids entier >= 0
 * @param {(n: number) => number} [intFn]  source d'entiers, par défaut cryptographique
 * @returns {T}
 */
export function pickWeighted(items, weightOf, intFn = randInt) {
  const weights = items.map((it) => Math.max(0, Math.round(weightOf(it))));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new RangeError('pickWeighted: poids total nul');
  let r = intFn(total);
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) return items[i];
    r -= weights[i];
  }
  return items[items.length - 1];
}

/** Hachage 32 bits d'une chaîne (FNV-1a) : sert de graine. */
export function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Générateur déterministe (mulberry32). Retourne une fonction () => [0, 1). */
export function seeded(seed) {
  let a = (typeof seed === 'string' ? hashStr(seed) : seed) >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Adapte un générateur [0, 1) en source d'entiers pour pickWeighted. */
export const intFrom = (next) => (n) => Math.min(n - 1, Math.floor(next() * n));

/** Identifiant court, non devinable. */
export function uid(prefix = '') {
  const buf = new Uint8Array(9);
  crypto.getRandomValues(buf);
  return prefix + Array.from(buf, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
}
