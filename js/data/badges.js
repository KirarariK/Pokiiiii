// Progression : l'expérience (XP) débloque des badges, un par type.
// L'XP est indexée sur la marge théorique du site (RULES.xpPerEuroOfMargin) :
// un euro misé sur un pack à 10 % de marge rapporte 1 XP.
// Chaque badge fixe la part de cette marge qui revient au joueur en cashback.

export const BADGES = [
  { id: 'bourgeon', name: 'Badge Bourgeon', theme: 'plante', icon: 'leaf', xp: 0, cashback: 0.04 },
  { id: 'onde', name: 'Badge Onde', theme: 'eau', icon: 'droplet', xp: 50, cashback: 0.05 },
  { id: 'braise', name: 'Badge Braise', theme: 'feu', icon: 'flame', xp: 150, cashback: 0.06 },
  { id: 'foudre', name: 'Badge Foudre', theme: 'electrik', icon: 'zap', xp: 400, cashback: 0.07 },
  { id: 'givre', name: 'Badge Givre', theme: 'glace', icon: 'snowflake', xp: 1000, cashback: 0.08 },
  { id: 'eclat', name: 'Badge Éclat', theme: 'fee', icon: 'sparkles', xp: 2500, cashback: 0.09 },
  { id: 'esprit', name: 'Badge Esprit', theme: 'psy', icon: 'eye', xp: 6000, cashback: 0.1 },
  { id: 'ombre', name: 'Badge Ombre', theme: 'tenebres', icon: 'moon', xp: 15000, cashback: 0.11 },
  { id: 'ecaille', name: 'Badge Écaille', theme: 'dragon', icon: 'crown', xp: 40000, cashback: 0.12 },
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
