// Transparence et jeu responsable : ce que vaut chaque jeu en moyenne, comment
// une carte est tirée, limites de la démonstration et reste à faire.

import { PRICES_DATE, RULES } from '../config.js';
import { dropTable, expectedValue, packAvailable, packReturn, profitChance } from '../catalog.js';
import { BADGES } from '../data/badges.js';
import { belowPriceRange } from '../data/faq.js';
import { listGiveaways } from '../data/giveaways.js';
import { PACKS } from '../data/packs.js';
import { dateFr, esc, eur, num, pct, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { note, pageHead } from '../ui/blocks.js';

const percent = (x) => `${Math.round(x * 100)} %`;

function packRows() {
  return PACKS.map((pack) => {
    if (!packAvailable(pack)) return `<tr><th scope="row"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th><td class="num">${eur(pack.price)}</td><td class="muted" colspan="4">En rupture</td></tr>`;
    const ev = expectedValue(pack);
    return `<tr>
      <th scope="row"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th>
      <td class="num">${eur(pack.price)}</td>
      <td class="num">${eur(ev)}</td>
      <td class="num"><strong>${pctFine(packReturn(pack))}</strong></td>
      <td class="num">${pctFine(profitChance(pack))}</td>
      <td class="num">${num(dropTable(pack).length)}</td>
    </tr>`;
  }).join('');
}

const TODO = [
  ['landmark', 'Société', 'Immatriculation, mentions légales, CGV et CGU rédigées par un juriste.'],
  ['scale', 'Modèle à refondre', "En France, payer pour un tirage dont le lot se revend contre de l'argent est un jeu d'argent, interdit hors des opérateurs autorisés, et aucun agrément n'existe pour ce type de jeu. Le modèle montré ici ne peut donc pas ouvrir tel quel : il doit être refondu, puis validé par un avocat."],
  ['dices', 'Tirage tenu côté serveur', "Graine serveur gardée côté serveur, chaque version de table archivée et datée, journal infalsifiable. Un audit du générateur d'aléa est une garantie technique : il ne vaut pas autorisation."],
  ['credit-card', 'Paiement', "Aucun solde retirable tenu par le site : cela relève d'un établissement agréé. Prestataire de paiement informé du modèle réel, lutte contre la fraude et les impayés."],
  ['scan-face', 'Identité et majorité', "Vérification de l'âge et de l'identité avant le premier paiement, pas au moment d'un retrait."],
  ['vault', 'Stock et logistique', "Inventaire tenu côté serveur et partagé par tous les joueurs, coffre assuré, expédition suivie, gestion des retours."],
  ['shield', 'Protection des joueurs', 'Limites de dépenses, rappels de session, pauses et auto-exclusion appliqués côté serveur.'],
  ['lock', 'Données personnelles', 'Registre des traitements, politique de confidentialité, bandeau cookies conforme.'],
];

export default {
  title: 'Transparence et jeu responsable',
  render() {
    const { edgeMin, edgeMax } = RULES.evolution;
    const low = Math.min(...PACKS.map((p) => p.target));
    const high = Math.max(...PACKS.map((p) => p.target));
    const fund = listGiveaways().find((g) => g.fundRate)?.fundRate ?? 0;
    const below = belowPriceRange();
    return `
    ${pageHead({ icon: 'scale', title: 'Transparence et jeu responsable' })}

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('percent', { size: 22 })}<span>Ce que vaut un pack en moyenne</span></h2></div>
      <p class="muted">Le retour théorique est ce que tu récupères en moyenne en revendant la carte dans les ${RULES.buybackLockMinutes} minutes, à ${percent(RULES.buybackRate)} de sa cote. Il va de <strong>${percent(low)}</strong> à <strong>${percent(high)}</strong> selon le pack : le reste est la marge du site.</p>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Pack</th><th class="num">Prix</th><th class="num">Cote moyenne</th><th class="num">Retour théorique</th><th class="num">Carte ≥ prix</th><th class="num">Cartes</th></tr></thead>
        <tbody>${packRows()}</tbody>
      </table></div>
      ${below ? `<p><strong>La moyenne cache l'essentiel :</strong> dans ${pct(below.low * 100)} à ${pct(below.high * 100)} des tirages selon le pack, la carte vaut moins que le prix payé.</p>` : ''}
      <p class="small muted">« Carte ≥ prix » : part des tirages où la carte vaut au moins le prix du pack. Revendue après la garantie, une carte est reprise à ${percent(RULES.buybackLaterRate)} : le retour baisse d'autant. Cotes indicatives relevées le ${dateFr(new Date(`${PRICES_DATE}T12:00:00`).getTime())} (Cardmarket, moyenne 30 jours, via pokemontcg.io) : un prix observé entre vendeurs tiers, qui ne distingue ni l'état ni la langue de l'exemplaire.</p>
      ${note("Une moyenne ne dit rien d'un tirage isolé : la plupart des cartes sortent dans les premiers paliers, et les gros lots sont rares. Ne compte jamais sur un pack pour te refaire.", 'warn')}
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('chevrons-up', { size: 22 })}Les autres jeux et avantages</h2>
      <ul>
        <li><strong>Évolution</strong> : chance de réussite = cote misée ÷ cote visée × (1 − marge). La marge va de ${percent(edgeMin)} à ${percent(edgeMax)} selon l'écart visé ; le retour théorique de chaque cible est affiché avant de jouer.</li>
        <li><strong>Cashback</strong> : de ${pct(BADGES[0].cashback * 100)} à ${pct(BADGES[BADGES.length - 1].cashback * 100)} de la marge du site sur tes mises, selon ton badge. La roue qui permet de le multiplier a une moyenne de ×1 : elle ne te fait ni gagner ni perdre sur la durée.</li>
        <li><strong>Bonus</strong> : crédités tout de suite, tenus à part tant que tu n'as pas misé ${RULES.bonus.wagering} fois leur montant en packs. Un pack compte en entier si sa marge atteint ${percent(RULES.bonus.fullWeightEdge)}, au prorata sinon. Un bonus ne bloque jamais le reste de ton solde.</li>
        <li><strong>Giveaways</strong> : financés par ${pct(fund * 100)} du prix de chaque pack événement vendu ; les lots se débloquent au fil des ventes et seuls les lots débloqués sont tirés au sort.</li>
        <li><strong>Classement</strong> : les dix premiers se partagent ${pct(RULES.leaderboardShare * 100)} de la marge du mois. Seuls les achats de packs donnent des points.</li>
        <li><strong>Livraison</strong> : forfait par envoi, plus ${pct(RULES.shippingInsurance.rate * 100)} d'envoi en valeur déclarée sur la cote expédiée au-delà de ${eur(RULES.shippingInsurance.from)}. La perte et la casse restent à la charge du vendeur jusqu'à la remise.</li>
      </ul>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('dices', { size: 22 })}Comment une carte est tirée</h2>
      <ol>
        <li><strong>Seules les cartes au coffre peuvent sortir.</strong> La table d'un pack répartit ${num(1_000_000)} tickets entre les cartes que le site possède à cet instant : la probabilité d'une carte, c'est la taille de sa plage. Une carte gagnée quitte le coffre, une carte rachetée y revient, et la table est recalculée pour que le retour reste celui affiché.</li>
        <li><strong>Les paliers fixent les grandes masses</strong> (les « répartitions »). À l'intérieur d'un palier, ${RULES.tierSkew ? 'la probabilité d’une carte est inversement proportionnelle à sa cote : les moins chères sortent plus souvent, comme dans un stock réel.' : 'toutes les cartes ont la même probabilité.'}</li>
        <li><strong>Un ticket est tiré de façon vérifiable</strong> à partir de ta graine, de la nôtre et d'un compteur. Tu peux le recalculer après coup : voir <a href="#/equite">Équité prouvable</a>.</li>
      </ol>
      <p>La rareté affichée (« Rare », « Mythique »…) est celle du palier : elle dépend du pack, pas de la rareté imprimée sur la carte.</p>
      <p>La roulette qui défile à l'ouverture ne décide de rien : le ticket est tiré à l'achat. Les cartes qui passent autour de la tienne sont tirées avec les mêmes probabilités que le pack ; aucune « presque-victoire » n'est fabriquée.</p>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('info', { size: 22 })}Ce que la démonstration ne fait pas</h2>
      <p><strong>Ce site est une maquette sans argent.</strong> Aucune autorité ne l'a autorisé, agréé ni certifié, et il ne sera pas ouvert en argent réel sous cette forme.</p>
      <ul>
        <li><strong>Aucun paiement</strong> : le solde est fait de crédits fictifs, et aucun retrait n'est possible.</li>
        <li><strong>Un coffre d'exemple</strong> : l'inventaire est un stock de démonstration, tenu dans ton navigateur. Il n'est pas partagé entre appareils.</li>
        <li><strong>Aucune expédition</strong> : les demandes de livraison restent locales.</li>
        <li><strong>Aucune communauté réelle</strong> : classement, dernières ouvertures, ventes et participants aux giveaways sont générés.</li>
        <li><strong>Aucun serveur</strong> : compte, tirages et graines vivent dans ton navigateur. La graine « serveur » y est donc lisible.</li>
      </ul>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('list-checks', { size: 22 })}<span>Avant l'ouverture au public</span></h2></div>
      <div class="todo">
        ${TODO.map(([name, title, text]) => `<article class="todo__item"><span class="todo__ico">${icon(name, { size: 20 })}</span><div><h3>${title}</h3><p class="muted">${text}</p></div></article>`).join('')}
      </div>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('shield', { size: 22 })}Jeu responsable</h2>
      <ul>
        <li>Le site est <strong>réservé aux personnes de ${RULES.minAge} ans ou plus</strong>.</li>
        <li>Ouvrir un pack n'est pas un placement : sur la durée, tous les jeux du site rendent moins que ce qu'on y met.</li>
        <li>Dans les <a href="#/parametres">paramètres</a> : limite de dépenses quotidienne, rappel de session, pause du compte.</li>
        <li>Si le jeu devient un problème pour toi ou un proche : <strong>Joueurs Info Service, 09 74 75 13 13</strong> (appel non surtaxé).</li>
      </ul>
    </section>`;
  },
};
