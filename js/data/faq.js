// Foire aux questions. Les réponses décrivent le fonctionnement prévu ;
// ce qui diffère en démonstration est précisé.

import { BRAND, RULES } from '../config.js';
import { eur } from '../format.js';
import { PACKS } from './packs.js';

const rate = Math.round(RULES.buybackRate * 100);
const later = Math.round(RULES.buybackLaterRate * 100);
const lowReturn = Math.round(Math.min(...PACKS.map((p) => p.target)) * 100);
const highReturn = Math.round(Math.max(...PACKS.map((p) => p.target)) * 100);

export const FAQ = [
  {
    q: `Comment fonctionne ${BRAND.name} ?`,
    a: `<p>${BRAND.name} vend des <strong>packs mystère</strong> : chaque pack contient <strong>une vraie carte à collectionner</strong>, conservée dans notre coffre.</p>
        <p>Tu ouvres ton pack en ligne, tu découvres ta carte, puis tu choisis :</p>
        <ul><li>la <strong>garder</strong> dans ta collection ;</li><li>te la <strong>faire livrer</strong> ;</li><li>la <strong>revendre</strong> à ${rate} % de sa cote dans les ${RULES.buybackLockMinutes} minutes, ${later} % ensuite.</li></ul>`,
  },
  {
    q: 'Comment les cartes sont-elles tirées ?',
    a: `<p>Un pack ne peut donner que des cartes <strong>réellement au coffre</strong>. Sa table de tirage, publiée sur sa page, liste chacune d'elles avec sa probabilité exacte et le nombre d'exemplaires. Le tirage désigne un ticket parmi un million ; la table dit à quelle carte il correspond.</p>
        <p>Ce ticket est <strong>vérifiable</strong> : il est calculé à partir d'une graine que nous fixons à l'avance, d'une graine que tu choisis et d'un compteur. Le détail est sur la page <a href="#/equite">Équité prouvable</a>. Pour savoir d'où sort une carte précise, cherche-la dans <a href="#/cartes">Cartes</a>.</p>`,
  },
  {
    q: 'Combien rapporte un pack en moyenne ?',
    a: `<p>Chaque pack affiche son <strong>retour théorique</strong> : ce qu'on récupère en moyenne en revendant la carte aussitôt. Il va de ${lowReturn} % à ${highReturn} % selon le pack : sur 100 € dépensés, il en revient donc ${lowReturn} à ${highReturn} en moyenne.</p>
        <p>Les chiffres de tous les packs sont réunis sur la page <a href="#/transparence">Transparence</a>. Sur la durée, le jeu coûte plus qu'il ne rapporte.</p>`,
  },
  {
    q: 'À quel prix puis-je revendre ma carte ?',
    a: `<p><strong>${rate} % de sa cote</strong> pendant les ${RULES.buybackLockMinutes} minutes qui suivent l'ouverture : c'est le prix garanti. Passé ce délai, le rachat se fait à <strong>${later} %</strong>.</p>
        <p>Tu peux aussi garder ta carte au coffre sans limite de durée, ou te la faire livrer.</p>`,
  },
  {
    q: "Qu'est-ce que l'Évolution ?",
    a: `<p>Tu mises une carte de ton coffre pour tenter d'en obtenir une plus cotée. La chance de réussite vaut la cote misée divisée par la cote visée, moins la marge du site : de ${Math.round(RULES.evolution.edgeMin * 100)} % pour une petite marche à ${Math.round(RULES.evolution.edgeMax * 100)} % pour les plus grands écarts.</p>
        <p>En cas de réussite, la carte visée remplace la tienne. En cas d'échec, <strong>la carte misée est perdue</strong>.</p>`,
  },
  {
    q: 'Comment fonctionne le cashback ?',
    a: `<p>Une part de la marge du site sur tes mises alimente ta <a href="#/recompenses">cagnotte</a>. Tu l'encaisses telle quelle, ou tu la joues à la roue, qui la multiplie par 0,5 à 5 avec une moyenne de 1.</p>
        <p>L'XP débloque neuf badges, un par type, et chaque badge augmente ta part. Le cashback rend une partie de ce que le jeu coûte : il ne le rend pas gagnant.</p>`,
  },
  {
    q: "Qu'est-ce qu'un bonus à jouer ?",
    a: `<p>Un bonus (premier dépôt, crédit de bienvenue) s'ajoute à ton solde tout de suite. Tes achats sont payés avec ton argent d'abord, avec le bonus ensuite.</p>
        <p>Le bonus, et ce qu'il t'a rapporté, deviennent retirables une fois que tu as misé <strong>${RULES.bonus.wagering} fois son montant</strong> en packs. D'ici là, une carte payée avec un bonus peut être gardée ou revendue, mais pas expédiée.</p>
        <p>Ton argent déposé n'est jamais bloqué : ton <a href="#/solde">solde</a> indique à tout moment ce qui est retirable.</p>
        <p class="muted">Un bonus prend fin quand il a été joué, ou quand il n'en reste rien à jouer : moins d'un euro de bonus et plus de carte payée avec, ou un solde qui ne permet plus d'acheter un pack avec un coffre vide. Le reliquat est alors repris.</p>`,
  },
  {
    q: 'Quels moyens de paiement sont acceptés ?',
    a: `<p>En démonstration, le solde est alimenté par des <strong>crédits fictifs</strong> : aucun paiement n'est effectué.</p>
        <p>Au lancement, les paiements par carte bancaire passeront par un prestataire de paiement agréé (norme PCI DSS).</p>`,
  },
  {
    q: "Puis-je récupérer l'argent de mes reventes ?",
    a: `<p>Une carte revendue est rachetée à <strong>${rate} % de sa cote</strong> pendant la garantie de prix, ${later} % ensuite. Le montant est crédité sur ton solde.</p>
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
        <ul><li>le solde (crédits fictifs, aucun paiement) ;</li><li>le coffre (un inventaire d'exemple, propre à ton navigateur) ;</li><li>les livraisons (rien n'est expédié) ;</li><li>la communauté (classement, dernières ouvertures et participants sont générés).</li></ul>
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
