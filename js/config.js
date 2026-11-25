// Configuration centrale. Tout ce qui relève de la marque ou des règles
// commerciales se change ici, sans toucher au reste du code.

export const BRAND = {
  /** Nom de travail (repris du dépôt) : à remplacer par la marque définitive. */
  name: 'Pokiiiii',
  tagline: 'Ouvre en ligne. Reçois en vrai.',
  baseline: 'Packs mystère, vraies cartes.',
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
  /** Part de la cote reversée lors d'un rachat instantané. */
  buybackRate: 0.9,
  /** Durée pendant laquelle le prix de rachat est garanti après l'ouverture. */
  buybackLockMinutes: 10,
  maxPacksPerOrder: 10,
  /** Retour visé en revente immédiate : sert de garde-fou à la conception des packs. */
  targetReturn: 0.9,
  /**
   * Tirage à l'intérieur d'un palier : 0 = toutes les cartes se valent,
   * 1 = probabilité inversement proportionnelle à la cote (défaut).
   */
  tierSkew: 1,
  /**
   * Évolution : on mise une carte pour tenter d'en obtenir une plus cotée.
   * Chance = (cote misée / cote visée) × (1 − edge), plafonnée à maxChance.
   * La cible doit valoir au moins minRatio fois la carte misée.
   */
  evolution: { edge: 0.08, maxChance: 0.8, minRatio: 1.25 },
  /** Récompense du jour : [montant en centimes, tickets sur 1 000 000]. Moyenne : 0,50 €. */
  dailyReward: [[10, 400_000], [25, 300_000], [50, 180_000], [100, 80_000], [250, 30_000], [1000, 9_000], [5000, 1_000]],
  /** Crédit fictif offert à la création du compte démo (en centimes). */
  welcomeCredit: 100_00,
  /** Montants de recharge proposés en démo (en centimes). */
  topups: [20_00, 50_00, 100_00, 250_00],
  /** 1 € dépensé en packs = 1 point ; 1 € reçu en rachat = 1 point. */
  pointsPerEuro: 1,
  /** Barème de livraison indicatif (démo) : forfait + supplément par carte. */
  shipping: {
    fr: { label: 'France métropolitaine', base: 4_90, perExtraCard: 50, delay: '10 à 12 jours ouvrés' },
    eu: { label: 'Europe', base: 9_90, perExtraCard: 80, delay: '10 à 15 jours ouvrés' },
  },
  /** Virement : délai annoncé et montant minimum (à confirmer avec le prestataire). */
  withdrawal: { minimum: 20_00, delay: '7 à 14 jours ouvrés' },
  minAge: 18,
};

export const STORAGE_KEY = 'pokiiiii.demo.v1';

/** Date de la dernière mise à jour des cotes embarquées (voir scripts/build-cards.mjs). */
export { PRICES_DATE } from './data/cards.js';
