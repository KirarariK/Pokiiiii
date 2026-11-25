// Classement des collectionneurs : mensuel, total, récompenses.

import { communityRanking } from '../data/community.js';
import { packBySlug } from '../data/packs.js';
import { esc, eurShort, initials, num } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn, monthlyPoints } from '../store.js';
import { note, pageHead, sectionHead } from '../ui/blocks.js';
import { countdownBlocks } from '../ui/countdown.js';
import { packArt } from '../ui/pack-art.js';

const ui = { tab: 'monthly' };

/** Récompenses mensuelles (exemple pour la démo : montants à arrêter). */
const REWARDS = [
  { rank: '1er', icon: 'trophy', label: "150 € d'avoir", desc: 'Crédités sur le solde du vainqueur du mois.', tone: 'gold' },
  { rank: '2e', icon: 'medal', label: "75 € d'avoir", desc: 'Pour le dauphin du classement mensuel.', tone: 'silver' },
  { rank: '3e', icon: 'award', label: "40 € d'avoir", desc: 'La troisième marche du podium.', tone: 'bronze' },
  { rank: '4e – 10e', pack: 'pro', label: '1 Booster Pro', desc: 'Offert à chaque joueur du top 10.' },
];

function nextMonthStart(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

function ranking(period) {
  const rows = communityRanking(period).map((r) => ({ ...r, me: false }));
  if (isLoggedIn()) {
    const { user, points } = getState();
    rows.push({ pseudo: user.pseudo, points: period === 'monthly' ? monthlyPoints() : points.total, me: true });
  }
  return rows.sort((a, b) => b.points - a.points).map((r, i) => ({ ...r, rank: i + 1 }));
}

const RANK_ICON = { 1: 'trophy', 2: 'medal', 3: 'award' };

function row(r) {
  return `<li class="lb-row ${r.rank <= 3 ? `lb-row--top lb-row--${r.rank}` : ''} ${r.me ? 'is-me' : ''}">
    <span class="lb-row__rank">${RANK_ICON[r.rank] ? icon(RANK_ICON[r.rank], { size: 20, label: `${r.rank}e place` }) : `#${r.rank}`}</span>
    <span class="avatar avatar--sm" aria-hidden="true">${esc(initials(r.pseudo))}</span>
    <span class="lb-row__name">${esc(r.pseudo)}${r.me ? '<span class="badge badge--me">Toi</span>' : ''}</span>
    <span class="lb-row__pts"><strong>${num(r.points)}</strong><small>points</small></span>
  </li>`;
}

function board(period) {
  const rows = ranking(period);
  const top = rows.slice(0, 20);
  const me = rows.find((r) => r.me);
  const title = period === 'monthly' ? 'Classement mensuel' : 'Classement total';
  const sub = period === 'monthly' ? 'Points du mois en cours : remise à zéro le 1er de chaque mois.' : "Points cumulés depuis l'ouverture du compte.";
  return `<section class="panel panel--pad">
    ${sectionHead(title, { iconName: 'trending-up', note: 'Joueurs fictifs' })}
    <p class="muted small">${sub}</p>
    <ol class="lb">${top.map(row).join('')}</ol>
    ${me && me.rank > 20 ? `<p class="lb__sep" aria-hidden="true">···</p><ol class="lb">${row(me)}</ol>` : ''}
    ${!isLoggedIn() ? `<p class="center muted small"><a href="#/connexion?redirect=%2Fclassement">Connecte-toi</a> pour apparaître dans le classement.</p>` : ''}
  </section>`;
}

function rewards() {
  return `<section class="panel panel--pad">
    ${sectionHead('Récompenses mensuelles', { iconName: 'gift' })}
    <div class="grid-4">
      ${REWARDS.map((r) => {
        const pack = r.pack ? packBySlug(r.pack) : null;
        return `<article class="reward ${r.tone ? `reward--${r.tone}` : ''}">
          <span class="reward__ico">${pack ? packArt(pack) : icon(r.icon, { size: 30 })}</span>
          <span class="reward__rank">${r.rank}</span>
          <h3>${r.label}</h3>
          <p class="muted small">${r.desc}</p>
        </article>`;
      }).join('')}
    </div>
    ${note('Exemple de dotation pour la démonstration : montants et modalités à arrêter avant le lancement.', 'demo')}
  </section>`;
}

export default {
  nav: 'classement',
  title: 'Classement',
  render() {
    const tabs = [
      ['monthly', 'Mensuel'],
      ['total', 'Total'],
      ['rewards', 'Récompenses'],
    ];
    return `
    ${pageHead({ icon: 'trophy', title: 'Classement des collectionneurs', lead: 'Grimpe au classement en ouvrant des packs et remporte les récompenses du mois.' })}

    <div class="panel panel--pad gw-clock">
      ${icon('clock', { size: 22 })}
      <div><span class="muted small">Remise à zéro dans :</span>${countdownBlocks(nextMonthStart())}</div>
    </div>

    <div class="panel panel--pad rules">
      <span class="rules__ico">${icon('info', { size: 20 })}</span>
      <div>
        <h2>Comment gagner des points ?</h2>
        <ul>
          <li><strong>1 € dépensé = 1 point</strong> lors de tes achats de packs</li>
          <li><strong>1 € reçu = 1 point</strong> lors de tes reventes de cartes</li>
        </ul>
        <p class="muted small">Le classement ne donne lieu à aucun gain garanti. ${eurShort(100_00)} dépensés restent ${eurShort(100_00)} dépensés : fixe-toi une <a href="#/parametres">limite</a>.</p>
      </div>
    </div>

    <div class="tabs tabs--full" role="tablist" aria-label="Classements">
      ${tabs.map(([key, label]) => `<button class="tab ${ui.tab === key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.tab === key}" data-tab="${key}">${label}</button>`).join('')}
    </div>

    ${ui.tab === 'rewards' ? rewards() : board(ui.tab)}`;
  },
  mount(root, { rerender }) {
    const onClick = (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      ui.tab = tab.dataset.tab;
      rerender();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
