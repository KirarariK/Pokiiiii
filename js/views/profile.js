// Profil : identité du compte démo et chiffres clés.

import { cardById, cardRef } from '../catalog.js';
import { communityRanking } from '../data/community.js';
import { dateFr, esc, eur, initials, num } from '../format.js';
import { icon } from '../icons.js';
import { badgeProgress, getState, monthlyPoints, stats } from '../store.js';
import { pageHead, statTile } from '../ui/blocks.js';
import { cardImage, rarityBadge } from '../ui/card.js';

function monthlyRank(points) {
  return communityRanking('monthly').filter((r) => r.points > points).length + 1;
}

export default {
  nav: 'profil',
  title: 'Mon profil',
  auth: true,
  render() {
    const { user, points, xp } = getState();
    const badge = badgeProgress().current;
    const s = stats();
    const month = monthlyPoints();
    const best = s.best ? cardById(s.best.cardId) : null;
    const net = s.received - s.spent;

    return `
    ${pageHead({ icon: 'user', title: 'Mon profil' })}

    <section class="panel profile">
      <span class="avatar avatar--xl" aria-hidden="true">${esc(initials(user.pseudo))}</span>
      <div class="profile__id">
        <h2>${esc(user.pseudo)}</h2>
        <p class="muted">Compte démo créé le ${dateFr(user.since)}</p>
        <p class="profile__badges">
          <span class="badge badge--info">${icon('trophy', { size: 13 })}#${num(monthlyRank(month))} ce mois-ci</span>
          <span class="badge badge--info">${icon('star', { size: 13 })}${num(points.total)} points</span>
          <a class="badge badge--info" href="#/recompenses">${icon(badge.icon, { size: 13 })}${esc(badge.name)} · ${num(Math.floor(xp))} XP</a>
        </p>
      </div>
      <div class="profile__actions">
        <a class="btn btn--secondary" href="#/parametres">${icon('user-cog', { size: 16 })}Paramètres</a>
        <button class="btn btn--ghost" type="button" data-action="logout">${icon('log-out', { size: 16 })}Se déconnecter</button>
      </div>
    </section>

    <div class="stats stats--4">
      ${statTile({ iconName: 'package-open', label: 'Packs ouverts', value: num(s.packsOpened) })}
      ${statTile({ iconName: 'vault', label: 'Cartes au coffre', value: num(s.vaultCount), hint: eur(s.vaultValue) })}
      ${statTile({ iconName: 'arrow-up-right', label: 'Dépensé en packs', value: eur(s.spent) })}
      ${statTile({ iconName: 'arrow-down-left', label: 'Reçu en reventes', value: eur(s.received), hint: `solde net : ${net >= 0 ? '+' : '−'}${eur(Math.abs(net))}` })}
    </div>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('star', { size: 22 })}<span>Ma meilleure carte</span></h2></div>
      ${
        best
          ? `<div class="best" data-rarity="${s.best.rarity}">
              <span class="best__img">${cardImage(best, { hi: true })}</span>
              <div>
                ${rarityBadge(s.best.rarity, 'badge--lg')}
                <h3>${esc(best.name)}</h3>
                <p class="muted">${esc(best.set)} · ${esc(cardRef(best))}</p>
                <p class="best__value">${eur(s.best.value)}</p>
                <a class="btn btn--secondary" href="#/collection">${icon('archive', { size: 16 })}Voir ma collection</a>
              </div>
            </div>`
          : `<p class="muted">Tu n'as pas encore ouvert de pack. <a href="#/packs">Choisir un pack</a></p>`
      }
    </section>

    <div class="grid-2">
      <a class="panel panel--pad link-card" href="#/solde">${icon('wallet', { size: 22 })}<span><strong>Mon solde</strong><small>Recharges, reventes et mouvements</small></span>${icon('chevron-right', { size: 18 })}</a>
      <a class="panel panel--pad link-card" href="#/livraisons">${icon('truck', { size: 22 })}<span><strong>Mes livraisons</strong><small>Suivre mes demandes d'envoi</small></span>${icon('chevron-right', { size: 18 })}</a>
    </div>`;
  },
};
