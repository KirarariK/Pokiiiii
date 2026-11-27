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
    slug: 'starter',
    name: 'Booster Starter',
    short: 'Starter',
    price: 9_95,
    theme: 'glacier',
    tagline: 'Pour commencer',
    target: 0.88,
    tiers: tiers([4, 6], [7, 9], [10, 15], [16, 25], [26, 50], [51, 300]),
  },
  {
    slug: 'evoli',
    name: 'Pack Évoli',
    short: 'Évoli',
    price: 19_90,
    theme: 'evoli',
    tagline: 'Évoli et ses huit évolutions',
    filter: { names: /(Eevee|Vaporeon|Jolteon|Flareon|Espeon|Umbreon|Leafeon|Glaceon|Sylveon)/ },
    target: 0.89,
    tiers: tiers([5, 9], [10, 19], [20, 39], [40, 79], [80, 159], [160, 650]),
  },
  {
    slug: 'pro',
    name: 'Booster Pro',
    short: 'Pro',
    price: 24_95,
    theme: 'orage',
    tagline: 'Le choix des habitués',
    target: 0.9,
    tiers: tiers([10, 15], [16, 25], [26, 45], [46, 99], [100, 249], [250, 500]),
  },
  {
    slug: 'retro',
    name: 'Pack Rétro',
    short: 'Rétro',
    price: 29_90,
    theme: 'retro',
    tagline: 'Les séries des années 1999-2002',
    filter: { sets: ['base1', 'base2', 'base3', 'base5', 'gym1', 'gym2', 'neo1', 'neo2', 'neo3', 'neo4'] },
    target: 0.89,
    tiers: tiers([10, 15], [16, 25], [26, 50], [51, 99], [100, 199], [200, 650]),
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
    target: 0.86,
    tiers: tiers([16, 25], [26, 49], [50, 99], [100, 199], [200, 299], [300, 650]),
  },
  {
    slug: 'master',
    name: 'Booster Master',
    short: 'Master',
    price: 49_95,
    theme: 'jungle',
    tagline: 'Sélection resserrée',
    target: 0.9,
    tiers: tiers([20, 29], [30, 49], [50, 79], [80, 149], [150, 299], [300, 650]),
  },
  {
    slug: 'expert',
    name: 'Booster Expert',
    short: 'Expert',
    price: 99_95,
    theme: 'zenith',
    tagline: 'Pour collectionneurs exigeants',
    target: 0.91,
    tiers: tiers([40, 59], [60, 99], [100, 149], [150, 249], [250, 449], [450, 1050]),
  },
  {
    slug: 'legende',
    name: 'Booster Légende',
    short: 'Légende',
    price: 249_00,
    theme: 'legende',
    tagline: 'Les plus grosses cartes du coffre',
    target: 0.92,
    tiers: tiers([100, 149], [150, 199], [200, 299], [300, 449], [450, 649], [650, 1600]),
  },
];

export const packBySlug = (slug) => PACKS.find((p) => p.slug === slug) || null;
