/** Starters officiels par génération */
export const STARTERS_BY_GEN = {
  1: [
    { id: 1, label: 'Bulbizarre' },
    { id: 4, label: 'Salamèche' },
    { id: 7, label: 'Carapuce' },
  ],
  2: [
    { id: 152, label: 'Germignon' },
    { id: 155, label: 'Héricendre' },
    { id: 158, label: 'Kaiminus' },
  ],
  3: [
    { id: 252, label: 'Arcko' },
    { id: 255, label: 'Poussifeu' },
    { id: 258, label: 'Gobou' },
  ],
  4: [
    { id: 387, label: 'Tortipouss' },
    { id: 390, label: 'Ouisticram' },
    { id: 393, label: 'Tiplouf' },
  ],
  5: [
    { id: 495, label: 'Vipélierre' },
    { id: 498, label: 'Gruikui' },
    { id: 501, label: 'Moustillon' },
  ],
  6: [
    { id: 650, label: 'Marisson' },
    { id: 653, label: 'Feunnec' },
    { id: 656, label: 'Grenousse' },
  ],
  7: [
    { id: 722, label: 'Brindibou' },
    { id: 725, label: 'Flamiaou' },
    { id: 728, label: 'Otaquin' },
  ],
  8: [
    { id: 810, label: 'Ouistempo' },
    { id: 813, label: 'Flambino' },
    { id: 816, label: 'Larméléon' },
  ],
  9: [
    { id: 906, label: 'Poussacha' },
    { id: 909, label: 'Chochodile' },
    { id: 912, label: 'Coiffeton' },
  ],
};

export const STARTERS = STARTERS_BY_GEN[1].map((s) => s.id);

export const ALL_STARTER_IDS = Object.values(STARTERS_BY_GEN).flatMap((g) =>
  g.map((s) => s.id)
);

export const GEN_META = {
  1: { name: 'Kanto', roman: 'I' },
  2: { name: 'Johto', roman: 'II' },
  3: { name: 'Hoenn', roman: 'III' },
  4: { name: 'Sinnoh', roman: 'IV' },
  5: { name: 'Unys', roman: 'V' },
  6: { name: 'Kalos', roman: 'VI' },
  7: { name: 'Alola', roman: 'VII' },
  8: { name: 'Galar', roman: 'VIII' },
  9: { name: 'Paldea', roman: 'IX' },
};
