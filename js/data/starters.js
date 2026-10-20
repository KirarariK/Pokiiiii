/** Starters shinobi — formes de base (ids depuis shinobi-all.json). */
export const GEN_META = {
  1: { id: 1, roman: 'I', name: 'Partie I', region: 'Konoha' },
  2: { id: 2, roman: 'II', name: 'Shippuden', region: 'Cinq Nations' },
  3: { id: 3, roman: 'III', name: 'Guerre', region: 'Alliance shinobi' },
  4: { id: 4, roman: 'IV', name: 'Boruto', region: 'Nouvelle ère' },
};

/** Starters par saga — Team 7 + héritiers. */
export const STARTERS_BY_GEN = {
  1: [14, 29, 23], // Naruto, Sasuke, Sakura (enfants)
  2: [15, 31, 24], // ado / Hebi / ship
  3: [19, 33, 25], // bijû / EMS / byakugou
  4: [1, 27, 12], // Boruto, Sarada, Mitsuki
};
