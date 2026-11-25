// Catalogue des packs.
// Grille de prix et de répartitions calquée sur le site de référence analysé
// (voir docs/ANALYSE_CARDMATIK.md) : c'est un point de départ à ajuster.
//
// Chaque palier : cote minimale et maximale de la carte (en euros, bornes
// incluses), probabilité en % et rareté affichée. La somme des probabilités
// d'un pack doit faire 100 (contrôlé par scripts/smoke.mjs).

/** @typedef {'commune'|'peu_commune'|'rare'|'ultra_rare'|'legendaire'} Rarity */

export const RARITIES = {
  commune: { label: 'Commune', rank: 0 },
  peu_commune: { label: 'Peu commune', rank: 1 },
  rare: { label: 'Rare', rank: 2 },
  ultra_rare: { label: 'Ultra rare', rank: 3 },
  legendaire: { label: 'Légendaire', rank: 4 },
};

export const PACKS = [
  {
    slug: 'starter',
    name: 'Booster Starter',
    short: 'Starter',
    price: 9_95,
    theme: 'glacier',
    tagline: 'Carte mystère non gradée',
    desc: "Le pack d'entrée pour étoffer une collection sans se ruiner. À chaque ouverture, une carte authentique non gradée tirée de notre inventaire. État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.",
    tiers: [
      { min: 4, max: 6, p: 40, rarity: 'commune' },
      { min: 7, max: 9, p: 25, rarity: 'commune' },
      { min: 10, max: 15, p: 18, rarity: 'peu_commune' },
      { min: 16, max: 25, p: 10, rarity: 'rare' },
      { min: 26, max: 50, p: 5.5, rarity: 'ultra_rare' },
      { min: 51, max: 275, p: 1.5, rarity: 'legendaire' },
    ],
  },
  {
    slug: 'pro',
    name: 'Booster Pro',
    short: 'Pro',
    price: 24_95,
    theme: 'orage',
    tagline: 'Carte mystère non gradée',
    desc: "Pour les collectionneurs réguliers : des classiques emblématiques aux illustrations les plus recherchées. Une carte authentique non gradée par pack. État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.",
    tiers: [
      { min: 12, max: 19, p: 35.5, rarity: 'commune' },
      { min: 20, max: 29, p: 33, rarity: 'peu_commune' },
      { min: 30, max: 49, p: 20, rarity: 'rare' },
      { min: 50, max: 99, p: 10, rarity: 'ultra_rare' },
      { min: 100, max: 475, p: 1.5, rarity: 'legendaire' },
    ],
  },
  {
    slug: 'master',
    name: 'Booster Master',
    short: 'Master',
    price: 49_95,
    theme: 'jungle',
    tagline: 'Carte mystère non gradée',
    desc: "Le cran au-dessus : une sélection resserrée de cartes de collection, avec de vraies pièces maîtresses au sommet. Une carte authentique non gradée par pack. État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.",
    tiers: [
      { min: 20, max: 26, p: 20, rarity: 'commune' },
      { min: 27, max: 39, p: 19.5, rarity: 'commune' },
      { min: 40, max: 59, p: 25, rarity: 'peu_commune' },
      { min: 60, max: 79, p: 20, rarity: 'rare' },
      { min: 80, max: 99, p: 12, rarity: 'ultra_rare' },
      { min: 100, max: 199, p: 2, rarity: 'legendaire' },
      { min: 200, max: 635, p: 1.5, rarity: 'legendaire' },
    ],
  },
  {
    slug: 'expert',
    name: 'Booster Expert',
    short: 'Expert',
    price: 99_95,
    theme: 'zenith',
    tagline: 'Carte mystère non gradée',
    desc: "Pensé pour les collectionneurs exigeants : chaque carte est retenue pour son illustration, son état et sa cote. Une carte authentique non gradée par pack. État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.",
    tiers: [
      { min: 40, max: 49, p: 30, rarity: 'commune' },
      { min: 50, max: 74, p: 25, rarity: 'peu_commune' },
      { min: 75, max: 89, p: 20, rarity: 'rare' },
      { min: 90, max: 199, p: 20, rarity: 'ultra_rare' },
      { min: 200, max: 399, p: 3, rarity: 'legendaire' },
      { min: 400, max: 1050, p: 2, rarity: 'legendaire' },
    ],
  },
  {
    slug: 'brasier',
    name: 'Pack Brasier',
    short: 'Brasier',
    price: 39_90,
    theme: 'brasier',
    tagline: 'Édition événement · cartes de type Feu',
    event: true,
    /** Chaque pack ouvert donne un ticket pour ce giveaway. */
    giveaway: 'brasier',
    /** Sélection restreinte aux cartes de type Feu (complétée si un palier est trop mince). */
    types: ['Fire'],
    desc: "L'édition événement : uniquement des cartes de type Feu, des starters aux dragons les plus convoités. Chaque pack contient une vraie carte, stockée et assurée dans notre coffre, et donne un ticket pour le giveaway Brasier.",
    tiers: [
      { min: 18, max: 34, p: 55, rarity: 'commune' },
      { min: 35, max: 49, p: 25, rarity: 'peu_commune' },
      { min: 50, max: 69, p: 10, rarity: 'rare' },
      { min: 70, max: 99, p: 5, rarity: 'ultra_rare' },
      { min: 100, max: 149, p: 3.5, rarity: 'legendaire' },
      { min: 150, max: 450, p: 1.5, rarity: 'legendaire' },
    ],
  },
];

export const packBySlug = (slug) => PACKS.find((p) => p.slug === slug) || null;
