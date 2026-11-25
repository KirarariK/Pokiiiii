// Progression : l'expérience (XP) débloque des badges, un par type.
// 1 € engagé (achat de pack, carte misée en Évolution) = 1 XP.
// Chaque badge multiplie la récompense du jour.

export const BADGES = [
  { id: 'bourgeon', name: 'Badge Bourgeon', theme: 'plante', icon: 'leaf', xp: 0, daily: 1 },
  { id: 'onde', name: 'Badge Onde', theme: 'eau', icon: 'droplet', xp: 50, daily: 1.2 },
  { id: 'braise', name: 'Badge Braise', theme: 'feu', icon: 'flame', xp: 150, daily: 1.5 },
  { id: 'foudre', name: 'Badge Foudre', theme: 'electrik', icon: 'zap', xp: 400, daily: 2 },
  { id: 'givre', name: 'Badge Givre', theme: 'glace', icon: 'snowflake', xp: 1000, daily: 2.5 },
  { id: 'eclat', name: 'Badge Éclat', theme: 'fee', icon: 'sparkles', xp: 2500, daily: 3 },
  { id: 'esprit', name: 'Badge Esprit', theme: 'psy', icon: 'eye', xp: 6000, daily: 4 },
  { id: 'ombre', name: 'Badge Ombre', theme: 'tenebres', icon: 'moon', xp: 15000, daily: 5 },
  { id: 'ecaille', name: 'Badge Écaille', theme: 'dragon', icon: 'crown', xp: 40000, daily: 6 },
];

/** Badge atteint, badge suivant et avancement (0 à 1) vers celui-ci. */
export function progress(xp) {
  let index = 0;
  BADGES.forEach((b, i) => {
    if (xp >= b.xp) index = i;
  });
  const current = BADGES[index];
  const next = BADGES[index + 1] || null;
  const ratio = next ? (xp - current.xp) / (next.xp - current.xp) : 1;
  return { current, next, index, ratio: Math.min(1, Math.max(0, ratio)) };
}
