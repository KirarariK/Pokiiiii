// Gamme de packs.
//
// Chaque pack a une cible de retour théorique (target) : la part du prix que le
// joueur récupère, en moyenne, en revendant aussitôt sa carte. La marge du site
// sur ce parcours vaut donc 1 − target. Les cibles ne sont pas uniformes :
//   - les petits packs portent plus de marge (88-89 %) ;
//   - les gros packs sont plus serrés (91-92 %), pour retenir les gros joueurs ;
//   - le pack événement est à 86 % : ses points de marge en plus financent le
//     giveaway qui lui est attaché (voir js/data/giveaways.js).
//
// Un palier : cote minimale et maximale de la carte (euros, bornes incluses) et
// rareté affichée. Les probabilités ne sont pas écrites ici : elles sont
// calculées sur les cartes réellement au coffre (packTable() dans
// js/catalog.js), en progression géométrique d'un palier au suivant, pour que
// le retour tombe sur la cible. Un pack que le coffre ne permet pas de
// composer n'est pas en vente.

/** @typedef {'commune'|'peu_commune'|'rare'|'ultra_rare'|'legendaire'|'mythique'} Rarity */

export const RARITIES = {
  commune: { label: 'Commune', rank: 0 },
  peu_commune: { label: 'Peu commune', rank: 1 },
  rare: { label: 'Rare', rank: 2 },
  ultra_rare: { label: 'Ultra rare', rank: 3 },
  legendaire: { label: 'Légendaire', rank: 4 },
  mythique: { label: 'Mythique', rank: 5 },
};

const LADDER = ['commune', 'peu_commune', 'rare', 'ultra_rare', 'legendaire', 'mythique'];

/** Rareté d'une carte obtenue hors pack (Évolution), d'après sa seule cote en centimes. */
export function rarityByValue(cents) {
  const steps = [10_00, 25_00, 60_00, 150_00, 400_00];
  return LADDER[steps.filter((s) => cents >= s).length];
}

/** Construit les paliers à partir de couples [cote minimale, cote maximale]. */
const tiers = (...rows) => rows.map(([min, max], i) => ({ min, max, rarity: LADDER[i] }));

export const PACKS = [
  {
    slug: 'rosee',
    name: 'Pack Rosée',
    short: 'Rosée',
    price: 8_00,
    theme: 'glacier',
    tagline: 'Le premier pas',
    target: 0.88,
    tiers: tiers([3, 5], [6, 9], [10, 17], [18, 34], [35, 79], [80, 300]),
  },
  {
    slug: 'prisme',
    name: 'Pack Prisme',
    short: 'Prisme',
    price: 18_00,
    theme: 'prisme',
    tagline: 'Évoli et ses huit évolutions',
    filter: { names: /(Eevee|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon)/ },
    target: 0.89,
    tiers: tiers([5, 8], [9, 17], [18, 37], [38, 79], [80, 159], [160, 650]),
  },
  {
    slug: 'orage',
    name: 'Pack Orage',
    short: 'Orage',
    price: 28_00,
    theme: 'orage',
    tagline: 'Le juste milieu',
    target: 0.9,
    tiers: tiers([11, 17], [18, 29], [30, 54], [55, 109], [110, 259], [260, 550]),
  },
  {
    slug: 'millesime',
    name: 'Pack Millésime',
    short: 'Millésime',
    price: 35_00,
    theme: 'millesime',
    tagline: 'Les séries de 1999 à 2002',
    filter: { sets: ['base1', 'base2', 'base3', 'base5', 'gym1', 'gym2', 'neo1', 'neo2', 'neo3', 'neo4'] },
    target: 0.89,
    tiers: tiers([12, 19], [20, 34], [35, 64], [65, 129], [130, 259], [260, 700]),
  },
  {
    slug: 'brasier',
    name: 'Pack Brasier',
    short: 'Brasier',
    price: 45_00,
    theme: 'brasier',
    tagline: 'Événement · cartes de type Feu',
    event: true,
    /** Chaque pack ouvert donne un ticket pour ce giveaway. */
    giveaway: 'brasier',
    filter: { types: ['Fire'] },
    target: 0.86,
    tiers: tiers([18, 27], [28, 54], [55, 109], [110, 219], [220, 349], [350, 700]),
  },
  {
    slug: 'canopee',
    name: 'Pack Canopée',
    short: 'Canopée',
    price: 60_00,
    theme: 'jungle',
    tagline: 'Sélection resserrée',
    target: 0.9,
    tiers: tiers([24, 35], [36, 59], [60, 99], [100, 179], [180, 349], [350, 750]),
  },
  {
    slug: 'zenith',
    name: 'Pack Zénith',
    short: 'Zénith',
    price: 120_00,
    theme: 'zenith',
    tagline: 'Pour viser haut',
    target: 0.91,
    tiers: tiers([48, 71], [72, 119], [120, 189], [190, 319], [320, 549], [550, 1200]),
  },
  {
    slug: 'joyau',
    name: 'Pack Joyau',
    short: 'Joyau',
    price: 300_00,
    theme: 'joyau',
    tagline: 'Les plus grosses cartes du coffre',
    target: 0.92,
    tiers: tiers([120, 179], [180, 259], [260, 379], [380, 549], [550, 799], [800, 1600]),
  },
];

export const packBySlug = (slug) => PACKS.find((p) => p.slug === slug) || null;
