// Transparence et jeu responsable : fonctionnement du tirage, chiffres par pack,
// limites de la démonstration et reste à faire avant le lancement.

import { PRICES_DATE, RULES } from '../config.js';
import { expectedValue, packPool } from '../catalog.js';
import { PACKS } from '../data/packs.js';
import { dateFr, esc, eur } from '../format.js';
import { icon } from '../icons.js';
import { note, pageHead } from '../ui/blocks.js';

const rate = Math.round(RULES.buybackRate * 100);

function packRows() {
  return PACKS.map((pack) => {
    const ev = expectedValue(pack);
    const buyback = Math.round(ev * RULES.buybackRate);
    const pool = packPool(pack);
    const ratio = Math.round((buyback / pack.price) * 100);
    return `<tr>
      <th scope="row"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th>
      <td class="num">${eur(pack.price)}</td>
      <td class="num">${eur(ev)}</td>
      <td class="num">${eur(buyback)}</td>
      <td class="num"><strong class="${ratio >= 100 ? 'pos' : 'neg'}">${ratio} %</strong></td>
      <td class="num">${pool.length}</td>
    </tr>`;
  }).join('');
}

const TODO = [
  ['landmark', 'Société', "Immatriculation, mentions légales, CGV et CGU rédigées par un juriste."],
  ['scale', 'Qualification juridique', "Faire valider le modèle : vente d'un bien à contenu aléatoire, ou jeu d'argent soumis à autorisation. La réponse conditionne tout le reste."],
  ['dices', 'Tirage certifié', "Tirage côté serveur sur un stock réel, générateur d'aléa audité, journal infalsifiable de chaque ouverture."],
  ['credit-card', 'Paiement', 'Prestataire de paiement agréé, lutte contre la fraude et les impayés.'],
  ['scan-face', 'Identité et majorité', "Vérification de l'âge à l'inscription et de l'identité (KYC) avant tout retrait."],
  ['vault', 'Stock et logistique', 'Inventaire carte par carte, coffre assuré, expédition suivie, gestion des retours.'],
  ['shield', 'Protection des joueurs', "Limites de dépenses, pauses, auto-exclusion et messages de prévention, côté serveur."],
  ['lock', 'Données personnelles', 'Registre des traitements, politique de confidentialité, bandeau cookies conforme.'],
];

export default {
  title: 'Transparence et jeu responsable',
  render() {
    return `
    ${pageHead({ icon: 'scale', title: 'Transparence et jeu responsable', lead: 'Comment une carte est tirée, ce que vaut un pack en moyenne, et ce que cette démonstration ne fait pas encore.' })}

    <section class="panel panel--pad prose">
      <h2>${icon('dices', { size: 22 })}Comment une carte est tirée</h2>
      <ol>
        <li><strong>Un palier de cote est tiré</strong> selon les probabilités affichées sur la page du pack (les « répartitions »).</li>
        <li><strong>Une carte est tirée dans ce palier.</strong> ${
          RULES.tierSkew
            ? 'Les cartes les moins cotées du palier sortent plus souvent que les plus cotées : la probabilité est inversement proportionnelle à la cote, comme dans un stock réel où les petites cartes sont plus nombreuses.'
            : 'Toutes les cartes du palier ont la même probabilité.'
        }</li>
      </ol>
      <p>La rareté affichée (« Rare », « Légendaire »…) est celle du palier : elle dépend du pack, pas de la rareté imprimée sur la carte.</p>
      ${note("En démonstration, le tirage est fait dans ton navigateur avec son générateur d'aléa cryptographique. Un tirage côté client est falsifiable : au lancement, il sera fait sur nos serveurs, sur un stock réel, et journalisé.", 'demo')}
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('percent', { size: 22 })}<span>Ce que vaut un pack en moyenne</span></h2></div>
      <p class="muted">Calculé à partir des répartitions et des cartes actuellement dans chaque sélection. La cote moyenne est ce que vaut, en moyenne, la carte tirée ; le retour est ce que tu récupères en la revendant tout de suite à ${rate} %.</p>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Pack</th><th class="num">Prix</th><th class="num">Cote moyenne</th><th class="num">Rachat moyen (${rate} %)</th><th class="num">Retour en revente</th><th class="num">Cartes</th></tr></thead>
        <tbody>${packRows()}</tbody>
      </table></div>
      <p class="small muted">Cotes indicatives relevées le ${dateFr(new Date(`${PRICES_DATE}T12:00:00`).getTime())} (Cardmarket, moyenne 30 jours, via pokemontcg.io). Une moyenne ne dit rien d'un tirage isolé : la plupart des cartes sortent dans les premiers paliers.</p>
      ${note("Ces chiffres sont ceux du catalogue de démonstration. Un retour supérieur à 100 % signifie qu'en l'état le pack rapporterait plus qu'il ne coûte : les répartitions, les prix ou la sélection de cartes sont à ajuster sur le stock réel avant toute mise en vente.", 'warn')}
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('info', { size: 22 })}Ce que la démonstration ne fait pas</h2>
      <ul>
        <li><strong>Aucun paiement</strong> : le solde est fait de crédits fictifs, et aucun retrait n'est possible.</li>
        <li><strong>Aucun stock</strong> : les cartes tirées ne sont pas adossées à des cartes physiques, une même carte peut sortir sans limite.</li>
        <li><strong>Aucune expédition</strong> : les demandes de livraison restent locales.</li>
        <li><strong>Aucune communauté réelle</strong> : classement, dernières ouvertures et participants aux giveaways sont générés.</li>
        <li><strong>Aucun compte en ligne</strong> : tout est enregistré dans ton navigateur.</li>
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
        <li>Ouvrir un pack n'est pas un placement : en moyenne, la carte obtenue ne compense pas toujours le prix payé.</li>
        <li>Tu peux fixer une <a href="#/parametres">limite de dépenses quotidienne</a> ou mettre ton compte en pause.</li>
        <li>Si le jeu devient un problème pour toi ou un proche : <strong>Joueurs Info Service, 09 74 75 13 13</strong> (appel non surtaxé).</li>
      </ul>
    </section>`;
  },
};
