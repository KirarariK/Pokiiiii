// Transparence et jeu responsable : fonctionnement du tirage, chiffres par pack,
// limites de la démonstration et reste à faire avant le lancement.

import { PRICES_DATE, RULES } from '../config.js';
import { dropTable, expectedValue, packReturn, profitChance } from '../catalog.js';
import { PACKS } from '../data/packs.js';
import { dateFr, esc, eur, num, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { note, pageHead } from '../ui/blocks.js';

const rate = Math.round(RULES.buybackRate * 100);
const target = Math.round(RULES.targetReturn * 100);

function packRows() {
  return PACKS.map((pack) => {
    const ev = expectedValue(pack);
    return `<tr>
      <th scope="row"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th>
      <td class="num">${eur(pack.price)}</td>
      <td class="num">${eur(ev)}</td>
      <td class="num">${eur(Math.round(ev * RULES.buybackRate))}</td>
      <td class="num"><strong>${pctFine(packReturn(pack))}</strong></td>
      <td class="num">${pctFine(profitChance(pack))}</td>
      <td class="num">${num(dropTable(pack).length)}</td>
    </tr>`;
  }).join('');
}

const TODO = [
  ['landmark', 'Société', 'Immatriculation, mentions légales, CGV et CGU rédigées par un juriste.'],
  ['scale', 'Qualification juridique', "Faire valider le modèle : vente d'un bien à contenu aléatoire, ou jeu d'argent soumis à autorisation. La réponse conditionne tout le reste."],
  ['dices', 'Tirage certifié', "Graine serveur gardée côté serveur, tables de tirage figées et datées, générateur d'aléa audité par un laboratoire agréé, journal infalsifiable."],
  ['credit-card', 'Paiement', 'Prestataire de paiement agréé, lutte contre la fraude et les impayés.'],
  ['scan-face', 'Identité et majorité', "Vérification de l'âge à l'inscription et de l'identité (KYC) avant tout retrait."],
  ['vault', 'Stock et logistique', 'Une carte physique par ligne de la table de tirage, coffre assuré, expédition suivie, gestion des retours.'],
  ['shield', 'Protection des joueurs', 'Limites de dépenses, rappels de session, pauses et auto-exclusion appliqués côté serveur.'],
  ['lock', 'Données personnelles', 'Registre des traitements, politique de confidentialité, bandeau cookies conforme.'],
];

export default {
  title: 'Transparence et jeu responsable',
  render() {
    return `
    ${pageHead({ icon: 'scale', title: 'Transparence et jeu responsable', lead: 'Ce que vaut un pack en moyenne, comment une carte est tirée, et ce que cette démonstration ne fait pas encore.' })}

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('percent', { size: 22 })}<span>Ce que vaut un pack en moyenne</span></h2></div>
      <p class="muted">Tous les packs sont conçus pour le même retour théorique : <strong>${target} %</strong>. La cote moyenne de la carte tirée vaut le prix du pack, et la revente immédiate en reprend ${rate} %. Autrement dit, sur un grand nombre de packs ouverts puis revendus, tu récupères environ ${target} € pour 100 € dépensés.</p>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Pack</th><th class="num">Prix</th><th class="num">Cote moyenne</th><th class="num">Rachat moyen</th><th class="num">Retour théorique</th><th class="num">Carte ≥ prix</th><th class="num">Cartes</th></tr></thead>
        <tbody>${packRows()}</tbody>
      </table></div>
      <p class="small muted">« Carte ≥ prix » : part des tirages où la carte vaut au moins le prix du pack. Cotes indicatives relevées le ${dateFr(new Date(`${PRICES_DATE}T12:00:00`).getTime())} (Cardmarket, moyenne 30 jours, via pokemontcg.io).</p>
      ${note("Une moyenne ne dit rien d'un tirage isolé : la plupart des cartes sortent dans les premiers paliers, et les gros lots sont rares. Ne compte jamais sur un pack pour te refaire.", 'warn')}
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('dices', { size: 22 })}Comment une carte est tirée</h2>
      <ol>
        <li><strong>Chaque pack a une table de tirage publiée</strong> : ${num(1_000_000)} tickets répartis entre ses cartes. La probabilité d'une carte, c'est la taille de sa plage de tickets. La table complète est sur la page du pack.</li>
        <li><strong>Les paliers fixent les grandes masses</strong> (les « répartitions »). À l'intérieur d'un palier, ${RULES.tierSkew ? 'la probabilité d’une carte est inversement proportionnelle à sa cote : les moins chères sortent plus souvent, comme dans un stock réel.' : 'toutes les cartes ont la même probabilité.'}</li>
        <li><strong>Un ticket est tiré de façon vérifiable</strong> à partir de ta graine, de la nôtre et d'un compteur. Tu peux le recalculer après coup : voir <a href="#/equite">Équité prouvable</a>.</li>
      </ol>
      <p>La rareté affichée (« Rare », « Mythique »…) est celle du palier : elle dépend du pack, pas de la rareté imprimée sur la carte.</p>
      <p>La roulette qui défile à l'ouverture ne décide de rien : le ticket est tiré à l'achat. Les cartes qui passent autour de la tienne sont tirées avec les mêmes probabilités que le pack ; aucune « presque-victoire » n'est fabriquée.</p>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('chevrons-up', { size: 22 })}Les autres jeux</h2>
      <ul>
        <li><strong>Évolution</strong> : chance de réussite = cote misée ÷ cote visée × ${Math.round((1 - RULES.evolution.edge) * 100)} %. Retour théorique : ${Math.round((1 - RULES.evolution.edge) * 100)} % de la cote misée.</li>
        <li><strong>Récompense du jour</strong> : gratuite, une fois par jour, barème affiché sur la page <a href="#/recompenses">Récompenses</a>.</li>
        <li><strong>Giveaways</strong> : gratuits pour les participants ; un ticket par pack éligible ouvert.</li>
      </ul>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('info', { size: 22 })}Ce que la démonstration ne fait pas</h2>
      <ul>
        <li><strong>Aucun paiement</strong> : le solde est fait de crédits fictifs, et aucun retrait n'est possible.</li>
        <li><strong>Aucun stock</strong> : les cartes tirées ne sont pas adossées à des cartes physiques, une même carte peut sortir sans limite.</li>
        <li><strong>Aucune expédition</strong> : les demandes de livraison restent locales.</li>
        <li><strong>Aucune communauté réelle</strong> : classement, dernières ouvertures et participants aux giveaways sont générés.</li>
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
