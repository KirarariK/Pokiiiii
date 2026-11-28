// Foire aux questions. Les réponses décrivent ce que fait la démonstration ;
// rien n'y est promis pour une version en argent réel (voir docs/AUDIT_JURIDIQUE.md).

import { BRAND, PRICES_DATE, PRICES_OLDEST, RULES } from '../config.js';
import { packAvailable, profitChance } from '../catalog.js';
import { dateFr, pct } from '../format.js';
import { PACKS } from './packs.js';

const monthFr = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
const rate = Math.round(RULES.buybackRate * 100);
const later = Math.round(RULES.buybackLaterRate * 100);
const lowReturn = Math.round(Math.min(...PACKS.map((p) => p.target)) * 100);
const highReturn = Math.round(Math.max(...PACKS.map((p) => p.target)) * 100);

/** Part des tirages où la carte vaut moins que le prix du pack, du pack le plus généreux au moins généreux. */
export function belowPriceRange() {
  const shares = PACKS.filter(packAvailable).map((p) => 1 - profitChance(p));
  return shares.length ? { low: Math.min(...shares), high: Math.max(...shares) } : null;
}

/** Les questions, recalculées à l'affichage : les chiffres suivent le coffre. */
export function faq() {
  const below = belowPriceRange();
  const belowText = below ? `c'est le cas de ${pct(below.low * 100)} à ${pct(below.high * 100)} des tirages selon le pack` : "c'est le cas de la plupart des tirages";
  return [
    {
      q: `Comment fonctionne ${BRAND.name} ?`,
      a: `<p>${BRAND.name} est une <strong>démonstration</strong> de packs mystère : chaque pack donne <strong>une carte à collectionner</strong>, tirée parmi celles du coffre.</p>
          <p>Tu ouvres ton pack, tu découvres ta carte, puis tu choisis :</p>
          <ul><li>la <strong>garder</strong> dans ta collection ;</li><li>demander sa <strong>livraison</strong> ;</li><li>la <strong>revendre</strong> à ${rate} % de sa cote dans les ${RULES.buybackLockMinutes} minutes, ${later} % ensuite.</li></ul>
          <p class="muted">Tout se joue avec des crédits fictifs : rien n'est vendu, rien n'est expédié.</p>`,
    },
    {
      q: 'Comment les cartes sont-elles tirées ?',
      a: `<p>Un pack ne peut donner que des cartes <strong>réellement au coffre</strong>. Sa table de tirage, publiée sur sa page, liste chacune d'elles avec sa probabilité exacte et le nombre d'exemplaires. Le tirage désigne un ticket parmi un million ; la table dit à quelle carte il correspond.</p>
          <p>Ce ticket est <strong>vérifiable</strong> : il est calculé à partir d'une graine fixée à l'avance, d'une graine que tu choisis et d'un compteur. Le détail est sur la page <a href="#/equite">Équité prouvable</a>. Pour savoir d'où sort une carte précise, cherche-la dans <a href="#/cartes">Cartes</a>.</p>`,
    },
    {
      q: 'Que vaut un pack en moyenne ?',
      a: `<p>Chaque pack affiche son <strong>retour moyen</strong> : ce qu'on récupère en moyenne en revendant la carte tout de suite, à ${rate} % de sa cote. Il va de ${lowReturn} % à ${highReturn} % du prix selon le pack.</p>
          <p>C'est une moyenne, tirée vers le haut par quelques cartes rares. Le plus souvent, ta carte vaut <strong>moins que le prix du pack</strong> : ${belowText}. La page de chaque pack donne le chiffre exact (« Carte ≥ prix »).</p>
          <p>Sur la durée, on dépense plus qu'on ne récupère. Tous les chiffres sont réunis sur la page <a href="#/transparence">Transparence</a>.</p>`,
    },
    {
      q: 'Puis-je perdre ?',
      a: `<p><strong>Oui, et c'est le cas le plus fréquent.</strong> La carte tirée est le plus souvent cotée moins que le prix du pack, et le rachat se fait sous la cote.</p>
          <p>Ici les crédits sont fictifs. Avec de l'argent réel, la règle serait la même que pour tout jeu de hasard : ne dépense que ce que tu peux te permettre de perdre, et fixe-toi une <a href="#/parametres">limite</a>.</p>`,
    },
    {
      q: "D'où viennent les cotes ?",
      a: `<p>La cote est le prix de vente moyen sur 30 jours relevé sur Cardmarket, fourni par pokemontcg.io. Les relevés vont de ${monthFr(PRICES_OLDEST)} à ${monthFr(PRICES_DATE)} : l'API ne rafraîchit pas toutes les cartes en même temps. Un prix de plus de six mois est abaissé de 10 %, et la cote retenue est le deuxième plus bas de plusieurs indicateurs (moyenne 30 jours, tendance, moyenne 7 jours, prix de vente moyen), jamais au-dessus de la moyenne 30 jours.</p>
          <p>C'est un prix observé entre vendeurs tiers, qui ne distingue ni l'état ni la langue de l'exemplaire. Ce n'est pas un prix garanti : un exemplaire réel peut valoir plus ou moins.</p>`,
    },
    {
      q: 'À quel prix puis-je revendre ma carte ?',
      a: `<p><strong>${rate} % de sa cote</strong> pendant les ${RULES.buybackLockMinutes} minutes qui suivent l'ouverture. Passé ce délai, le rachat se fait à <strong>${later} %</strong>. La cote retenue est celle du tirage pendant la garantie ; ensuite, c'est la plus basse des deux, celle du tirage ou celle du jour.</p>
          <p>Le montant est crédité sur ton solde fictif. Tu peux aussi garder ta carte dans ta collection.</p>`,
    },
    {
      q: "Qu'est-ce que l'Évolution ?",
      a: `<p>Tu mises une carte de ta collection pour tenter d'en obtenir une plus cotée. La chance de réussite vaut la cote misée divisée par la cote visée, moins la marge du site : de ${Math.round(RULES.evolution.edgeMin * 100)} % pour une petite marche à ${Math.round(RULES.evolution.edgeMax * 100)} % pour les plus grands écarts.</p>
          <p>En cas de réussite, la carte visée remplace la tienne. En cas d'échec, <strong>la carte misée est perdue</strong>.</p>`,
    },
    {
      q: 'Comment fonctionne le cashback ?',
      a: `<p>Une part de la marge du site sur tes mises alimente ta <a href="#/recompenses">cagnotte</a>. Tu l'encaisses telle quelle, ou tu la joues à la roue, qui la multiplie par 0,5 à 5 avec une moyenne de 1.</p>
          <p>L'XP débloque neuf badges, un par type, et chaque badge augmente ta part. Le cashback rend une partie de ce que le jeu coûte : il ne le rend pas gagnant.</p>`,
    },
    {
      q: "Qu'est-ce qu'un bonus à jouer ?",
      a: `<p>Un bonus (premier dépôt, crédit de bienvenue) s'ajoute à ton solde tout de suite. Tes achats sont payés avec tes crédits d'abord, avec le bonus ensuite.</p>
          <p>Le bonus, et ce qu'il t'a rapporté, restent à part tant que tu n'as pas misé <strong>${RULES.bonus.wagering} fois son montant</strong> en packs. Un pack compte en entier si sa marge atteint ${Math.round(RULES.bonus.fullWeightEdge * 100)} %, au prorata sinon : les packs les plus généreux comptent donc moins. D'ici là, une carte payée avec un bonus peut être gardée ou revendue, mais pas expédiée.</p>
          <p>Un bonus ne bloque jamais le reste de ton solde : la page <a href="#/solde">Solde</a> sépare les deux.</p>
          <p class="muted">Un bonus prend fin quand il a été joué, ou quand il n'en reste rien à jouer : moins d'un euro de bonus et plus de carte payée avec, ou un solde qui ne permet plus d'acheter un pack avec une collection vide. Le reliquat est alors repris.</p>`,
    },
    {
      q: 'Quels moyens de paiement sont acceptés ?',
      a: `<p><strong>Aucun.</strong> Le solde est fait de crédits fictifs : aucun paiement n'est possible, aucun retrait non plus.</p>`,
    },
    {
      q: 'Vais-je recevoir ma carte si je demande la livraison ?',
      a: `<p><strong>Non</strong> : en démonstration, aucune carte n'existe et rien n'est expédié. La demande de livraison montre seulement le parcours : adresse, frais, suivi.</p>`,
    },
    {
      q: 'Où sont stockées les cartes ?',
      a: `<p>Nulle part : le coffre est un inventaire d'exemple, tenu dans ton navigateur. Il sert à montrer comment un vrai stock piloterait les tirages : une carte ne peut sortir que si elle est au coffre.</p>`,
    },
    {
      q: "Qu'est-ce qui est fictif dans cette démonstration ?",
      a: `<p>Le parcours est réel, le reste est simulé :</p>
          <ul><li>le solde (crédits fictifs, aucun paiement) ;</li><li>le coffre (un inventaire d'exemple, propre à ton navigateur) ;</li><li>les livraisons (rien n'est expédié) ;</li><li>la communauté (classement, dernières ouvertures et participants sont générés).</li></ul>
          <p>Les visuels et les cotes proviennent d'une base publique et sont indicatifs.</p>`,
    },
    {
      q: 'Le site est-il autorisé ?',
      a: `<p>${BRAND.name} est une <strong>maquette</strong> : rien n'y est vendu, et aucune autorité ne l'a autorisé, agréé ni certifié.</p>
          <p>En France, payer pour un tirage au sort dont le lot se revend contre de l'argent est un jeu d'argent et de hasard, interdit en dehors des opérateurs autorisés. Aucun agrément n'existe pour ce type de jeu. Le site ne sera donc pas ouvert en argent réel sous cette forme.</p>
          <p>Le détail est sur la page <a href="#/transparence">Transparence</a>.</p>`,
    },
    {
      q: "Besoin d'aide ?",
      a: `<p>Écris-nous via le <a href="#/contact">formulaire de contact</a>. Si le jeu devient un problème pour toi ou un proche : Joueurs Info Service, <strong>09 74 75 13 13</strong> (appel non surtaxé), ou <a href="https://www.joueurs-info-service.fr" target="_blank" rel="noopener noreferrer">joueurs-info-service.fr</a>.</p>`,
    },
  ];
}
