// Foire aux questions. Les réponses décrivent le fonctionnement prévu ;
// ce qui diffère en démonstration est précisé.

import { BRAND, RULES } from '../config.js';
import { eur } from '../format.js';

const rate = Math.round(RULES.buybackRate * 100);

export const FAQ = [
  {
    q: `Comment fonctionne ${BRAND.name} ?`,
    a: `<p>${BRAND.name} vend des <strong>packs mystère</strong> : chaque pack contient <strong>une vraie carte à collectionner</strong>, conservée dans notre coffre.</p>
        <p>Tu ouvres ton pack en ligne, tu découvres ta carte, puis tu choisis :</p>
        <ul><li>la <strong>garder</strong> dans ta collection ;</li><li>te la <strong>faire livrer</strong> ;</li><li>la <strong>revendre</strong> aussitôt à ${rate} % de sa cote.</li></ul>`,
  },
  {
    q: 'Comment les cartes sont-elles tirées ?',
    a: `<p>Chaque pack affiche ses <strong>répartitions</strong> : la probabilité d'obtenir une carte dans chaque palier de cote. Le tirage choisit d'abord un palier selon ces probabilités, puis une carte dans ce palier.</p>
        <p>Le détail et la cote moyenne de chaque pack sont sur la page <a href="#/transparence">Transparence</a>.</p>`,
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: `<p>En démonstration, le solde est alimenté par des <strong>crédits fictifs</strong> : aucun paiement n'est effectué.</p>
        <p>Au lancement, les paiements par carte bancaire passeront par un prestataire de paiement agréé (norme PCI DSS).</p>`,
  },
  {
    q: "Puis-je récupérer l'argent de mes reventes ?",
    a: `<p>Une carte revendue est rachetée à <strong>${rate} % de sa cote de référence</strong>. Le montant est crédité sur ton solde.</p>
        <p>Ce solde sert à acheter d'autres packs. Au lancement, il pourra aussi être versé par virement, après vérification d'identité (KYC), à partir de ${eur(RULES.withdrawal.minimum)} et sous ${RULES.withdrawal.delay}.</p>
        <p class="muted">Le retrait est désactivé en démonstration.</p>`,
  },
  {
    q: 'Quand vais-je recevoir ma carte si je choisis la livraison ?',
    a: `<p>La carte est retirée du coffre, emballée avec soin et envoyée en suivi.</p>
        <ul><li>${RULES.shipping.fr.label} : <strong>${RULES.shipping.fr.delay}</strong></li><li>${RULES.shipping.eu.label} : <strong>${RULES.shipping.eu.delay}</strong></li></ul>
        <p>Les frais sont affichés avant validation. <span class="muted">En démonstration, aucune carte n'est expédiée.</span></p>`,
  },
  {
    q: 'Où sont stockées mes cartes ?',
    a: `<p>Dans un coffre sécurisé et assuré : contrôle d'accès, inventaire permanent, et chaque carte rattachée au compte de son propriétaire. Tu les retrouves à tout moment dans ta <a href="#/collection">collection</a>.</p>`,
  },
  {
    q: 'Puis-je perdre de la valeur ?',
    a: `<p><strong>Oui.</strong> La cote d'une carte dépend du marché : elle peut valoir plus ou moins que le prix du pack, et le plus souvent elle vaut moins que les plus grosses cartes mises en avant.</p>
        <p>La page <a href="#/transparence">Transparence</a> donne la cote moyenne d'une carte pour chaque pack. N'achète que ce que tu peux te permettre de dépenser, et fixe-toi une <a href="#/parametres">limite</a>.</p>`,
  },
  {
    q: "Qu'est-ce qui est fictif dans cette démonstration ?",
    a: `<p>Le parcours est réel, le reste est simulé :</p>
        <ul><li>le solde (crédits fictifs, aucun paiement) ;</li><li>le stock (les cartes tirées ne sont pas adossées à des cartes physiques) ;</li><li>les livraisons (rien n'est expédié) ;</li><li>la communauté (classement, dernières ouvertures et participants sont générés).</li></ul>
        <p>Les visuels et les cotes proviennent d'une base publique et sont indicatifs.</p>`,
  },
  {
    q: 'Le site est-il autorisé ?',
    a: `<p>${BRAND.name} est aujourd'hui une <strong>maquette</strong> : rien n'y est vendu. L'ouverture au public attend l'immatriculation de la société, la validation juridique du modèle et les agréments nécessaires.</p>
        <p>Le détail de ce qui reste à faire est sur la page <a href="#/transparence">Transparence</a>.</p>`,
  },
  {
    q: "Besoin d'aide ?",
    a: `<p>Écris-nous via le <a href="#/contact">formulaire de contact</a>. Si le jeu devient un problème pour toi ou un proche : Joueurs Info Service, <strong>09 74 75 13 13</strong> (appel non surtaxé).</p>`,
  },
];
