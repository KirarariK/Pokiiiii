// Gamme de packs.
//
// Chaque pack a une cible de retour théorique (target) : la part du prix que le
// joueur récupère, en moyenne, en revendant aussitôt sa carte. La marge du site
// sur ce parcours vaut donc 1 − target. Les cibles ne sont pas uniformes :
//   - les petits packs portent plus de marge (88-89 %) ;
//   - les gros packs sont plus serrés (91-92 %), pour retenir les gros joueurs ;
//   - le pack événement est à 86 % : ses points de marge en plus financent le
//     giveaway qui lui est attaché (voir js/data/giveaways.js).
// Les probabilités suivent une progression géométrique d'un palier au suivant,
// réglée sur le catalogue par scripts/design-packs.mjs ; scripts/smoke.mjs
// échoue si un pack s'écarte de sa cible de plus d'un point.
//
// Un palier : cote minimale et maximale de la carte (euros, bornes incluses),
// probabilité en % (au dixième) et rareté affichée. Le détail carte par carte
// est calculé par dropTable() dans js/catalog.js.

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

/** Construit les paliers à partir de triplets [min, max, probabilité]. */
const tiers = (...rows) => rows.map(([min, max, p], i) => ({ min, max, p, rarity: LADDER[i] }));

const GRADE = 'Carte authentique non gradée. État garanti : Near Mint minimum pour les séries récentes, Excellent pour les anciennes.';

export const PACKS = [
  {
    slug: 'starter',
    name: 'Booster Starter',
    short: 'Starter',
    price: 9_95,
    theme: 'glacier',
    tagline: 'Pour commencer',
    desc: `Le pack d'entrée : beaucoup de petites cartes sympas, et de temps en temps une vraie pièce. ${GRADE}`,
    target: 0.88,
    tiers: tiers([4, 6, 53.2], [7, 9, 25.2], [10, 15, 11.9], [16, 25, 5.7], [26, 50, 2.7], [51, 300, 1.3]),
  },
  {
    slug: 'evoli',
    name: 'Pack Évoli',
    short: 'Évoli',
    price: 19_90,
    theme: 'evoli',
    tagline: 'Évoli et ses huit évolutions',
    filter: { names: /(Eevee|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon)/ },
    desc: `Uniquement Évoli et ses évolutions, d'Aquali à Nymphali, des promos aux VMAX les plus recherchées. ${GRADE}`,
    target: 0.89,
    tiers: tiers([5, 9, 54.4], [10, 19, 25.1], [20, 39, 11.6], [40, 79, 5.3], [80, 159, 2.5], [160, 650, 1.1]),
  },
  {
    slug: 'pro',
    name: 'Booster Pro',
    short: 'Pro',
    price: 24_95,
    theme: 'orage',
    tagline: 'Le choix des habitués',
    desc: `Des classiques emblématiques aux illustrations alternatives : un pack équilibré, avec des sommets à plus de 250 €. ${GRADE}`,
    target: 0.9,
    tiers: tiers([10, 15, 56], [16, 25, 24.9], [26, 45, 11], [46, 99, 4.9], [100, 249, 2.2], [250, 500, 1]),
  },
  {
    slug: 'retro',
    name: 'Pack Rétro',
    short: 'Rétro',
    price: 29_90,
    theme: 'retro',
    tagline: 'Les séries des années 1999-2002',
    filter: { sets: ['base1', 'base2', 'base3', 'base5', 'gym1', 'gym2', 'neo1', 'neo2', 'neo3', 'neo4'] },
    desc: `Set de Base, Jungle, Fossile, Team Rocket, Gym, Neo : uniquement des cartes de la première époque, holos et brillantes comprises. ${GRADE}`,
    target: 0.89,
    tiers: tiers([10, 15, 50.7], [16, 25, 25.4], [26, 50, 12.7], [51, 99, 6.4], [100, 199, 3.2], [200, 650, 1.6]),
  },
  {
    slug: 'brasier',
    name: 'Pack Brasier',
    short: 'Brasier',
    price: 39_90,
    theme: 'brasier',
    tagline: 'Événement · cartes de type Feu',
    event: true,
    /** Chaque pack ouvert donne un ticket pour ce giveaway. */
    giveaway: 'brasier',
    filter: { types: ['Fire'] },
    desc: `L'édition événement : uniquement des cartes de type Feu, des starters aux dragons les plus convoités. Chaque pack donne un ticket pour le giveaway Brasier. ${GRADE}`,
    target: 0.86,
    tiers: tiers([16, 25, 61.6], [26, 49, 23.8], [50, 99, 9.2], [100, 199, 3.5], [200, 299, 1.4], [300, 650, 0.5]),
  },
  {
    slug: 'master',
    name: 'Booster Master',
    short: 'Master',
    price: 49_95,
    theme: 'jungle',
    tagline: 'Sélection resserrée',
    desc: `Le cran au-dessus : aucune carte sous 20 €, et de vraies pièces maîtresses au sommet. ${GRADE}`,
    target: 0.9,
    tiers: tiers([20, 29, 50.9], [30, 49, 25.4], [50, 79, 12.7], [80, 149, 6.3], [150, 299, 3.1], [300, 650, 1.6]),
  },
  {
    slug: 'expert',
    name: 'Booster Expert',
    short: 'Expert',
    price: 99_95,
    theme: 'zenith',
    tagline: 'Pour collectionneurs exigeants',
    desc: `Chaque carte est retenue pour son illustration, son état et sa cote : rien sous 40 €, jusqu'à plus de 1 000 €. ${GRADE}`,
    target: 0.91,
    tiers: tiers([40, 59, 45.6], [60, 99, 25.4], [100, 149, 14.2], [150, 249, 7.9], [250, 449, 4.4], [450, 1050, 2.5]),
  },
  {
    slug: 'legende',
    name: 'Booster Légende',
    short: 'Légende',
    price: 249_00,
    theme: 'legende',
    tagline: 'Les plus grosses cartes du coffre',
    desc: `Le sommet de la gamme : uniquement des cartes à trois chiffres, et les deux plus grosses pièces du coffre au bout. ${GRADE}`,
    target: 0.92,
    tiers: tiers([100, 149, 36.6], [150, 199, 24.4], [200, 299, 16.2], [300, 449, 10.8], [450, 649, 7.2], [650, 1600, 4.8]),
  },
];

export const packBySlug = (slug) => PACKS.find((p) => p.slug === slug) || null;
