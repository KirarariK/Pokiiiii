// Configuration centrale. Tout ce qui relève de la marque ou des règles
// commerciales se change ici, sans toucher au reste du code.
// Le pourquoi de chaque réglage économique est dans docs/GERANT.md.

export const BRAND = {
  /** Nom du site. Disponibilité (marque, domaine) à vérifier avant tout dépôt. */
  name: 'Coffreo',
  tagline: 'Chaque carte est au coffre. Chaque chance est affichée.',
  baseline: 'Packs mystère à table de tirage publique.',
  /** Coordonnées provisoires : à compléter une fois la société immatriculée. */
  email: 'contact@exemple.fr',
  supportEmail: 'support@exemple.fr',
  company: '[Raison sociale à compléter]',
  address: '[Adresse du siège à compléter]',
  social: { instagram: '#', tiktok: '#', x: '#' },
};

/** Le site tourne en démonstration : crédits fictifs, aucun paiement réel. */
export const DEMO = true;

export const RULES = {
  /* ---- Rachat --------------------------------------------------------- */
  /** Part de la cote reversée pour une revente pendant la garantie de prix. */
  buybackRate: 0.9,
  /** Durée de la garantie de prix après l'ouverture, en minutes. */
  buybackLockMinutes: 10,
  /**
   * Part de la cote reversée une fois la garantie passée. Plus basse : le site
   * porte alors le risque de cote, la garde et l'assurance de la carte.
   */
  buybackLaterRate: 0.85,

  /* ---- Packs ---------------------------------------------------------- */
  maxPacksPerOrder: 10,
  /** Un pack n'est en vente que si le coffre garnit au moins ce nombre de paliers. */
  minTiers: 3,
  /** Écart toléré entre le retour d'un pack et sa cible (pack.target), en points. */
  returnTolerance: 0.01,
  /**
   * Tirage à l'intérieur d'un palier : 0 = toutes les cartes se valent,
   * 1 = probabilité inversement proportionnelle à la cote (défaut).
   */
  tierSkew: 1,

  /* ---- Évolution ------------------------------------------------------ */
  /**
   * On mise une carte pour tenter d'en obtenir une plus cotée.
   * Chance = (cote misée / cote visée) × (1 − marge), plafonnée à maxChance.
   * La marge grandit avec l'ambition : edgeMin pour la plus petite marche
   * (minRatio), puis + edgeSlope par unité de multiplicateur, jusqu'à edgeMax.
   */
  evolution: { minRatio: 1.25, maxChance: 0.8, edgeMin: 0.06, edgeSlope: 0.006, edgeMax: 0.12 },

  /* ---- Fidélité ------------------------------------------------------- */
  /**
   * Cashback : une part de la MARGE théorique du site sur les mises du joueur
   * lui revient (le taux dépend de son badge, voir js/data/badges.js). Le coût
   * ne peut donc jamais dépasser ce que le joueur rapporte.
   */
  cashback: {
    /** Cagnotte minimale pour encaisser ou tenter la roue, en centimes. */
    minimum: 50,
    /** Roue : [multiplicateur, tickets sur 1 000 000]. Moyenne exactement ×1. */
    wheel: [[0.5, 430_000], [1, 350_000], [1.5, 130_000], [2, 70_000], [5, 20_000]],
  },
  /** XP gagnée par euro de marge théorique (10 XP : un pack à 10 % de marge rapporte 1 XP par euro). */
  xpPerEuroOfMargin: 10,
  /**
   * Classement : 1 € dépensé en packs = 1 point. Les rachats n'en donnent pas :
   * ils ne rapportent rien au site, il n'y a pas de raison de les récompenser.
   */
  pointsPerEuro: 1,
  /** Part de la marge du mois (sur les joueurs classés) redistribuée aux dix premiers. */
  leaderboardShare: 0.05,
  /** Partage de cette dotation : 1er, 2e, 3e, puis 4e à 10e à parts égales. */
  leaderboardSplit: [0.35, 0.2, 0.12, 0.33],

  /* ---- Bonus ---------------------------------------------------------- */
  /**
   * Un bonus n'est jamais retirable tel quel : il faut d'abord miser `wagering`
   * fois son montant en packs. À 10 fois, avec une marge moyenne de 10 %, le
   * joueur en reperd en moyenne l'équivalent en le jouant : le bonus offre du
   * temps de jeu, pas de l'argent. L'argent déposé, lui, reste toujours retirable.
   * Premier dépôt : firstDepositRate du montant, plafonné à firstDepositMax.
   */
  /**
   * fullWeightEdge : marge à partir de laquelle un pack compte en entier dans les mises d'un bonus.
   * En dessous, il compte au prorata : sans cela, un bonus joué sur les packs les plus généreux serait gagnant.
   */
  bonus: { wagering: 10, fullWeightEdge: 0.12, firstDepositRate: 0.1, firstDepositMax: 50_00 },
  /**
   * Crédit fictif offert à la création du compte démo, traité comme un bonus.
   * À mettre à 0 en production : un bonus sans dépôt attire surtout les comptes multiples.
   */
  welcomeCredit: 100_00,
  /** Montants de recharge proposés en démo (en centimes). */
  topups: [20_00, 50_00, 100_00, 250_00],
  /** Bornes d'une recharge au montant libre, en centimes. */
  topupMin: 5_00,
  topupMax: 1000_00,

  /* ---- Logistique ----------------------------------------------------- */
  /** Barème de livraison indicatif (démo) : forfait + supplément par carte. */
  shipping: {
    fr: { label: 'France métropolitaine', base: 4_90, perExtraCard: 50, delay: '10 à 12 jours ouvrés' },
    eu: { label: 'Europe', base: 9_90, perExtraCard: 80, delay: '10 à 15 jours ouvrés' },
  },
  /**
   * Assurance du colis : `rate` de la cote expédiée au-delà de `from`. Sans elle,
   * envoyer une carte à 1 000 € coûterait au site bien plus que le forfait.
   */
  shippingInsurance: { from: 50_00, rate: 0.01 },
  /** Virement : délai annoncé et montant minimum (à confirmer avec le prestataire). */
  withdrawal: { minimum: 20_00, delay: '7 à 14 jours ouvrés' },
  /** Délai avant qu'un relèvement ou un retrait de la limite de dépenses prenne effet. */
  limitRaiseDelayHours: 48,
  minAge: 18,
};

export const STORAGE_KEY = 'coffreo.demo.v1';
/** Inventaire du coffre (voir js/stock.js) et accès administrateur (voir js/admin.js). */
export const STOCK_KEY = 'coffreo.stock.v1';
export const ADMIN_KEY = 'coffreo.admin.v1';

/** Date de la dernière mise à jour des cotes embarquées (voir scripts/build-cards.mjs). */
export { PRICES_DATE } from './data/cards.js';
