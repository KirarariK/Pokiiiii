// Classement des collectionneurs : mensuel, total, récompenses.
//
// La dotation n'est pas un montant fixe : c'est une part de la marge du mois
// (RULES.leaderboardShare). Elle grossit avec l'activité et ne peut pas coûter
// plus que ce que les joueurs classés ont rapporté.

import { RULES } from '../config.js';
import { communityRanking } from '../data/community.js';
import { blendedEdge } from '../economics.js';
import { esc, eur, eurShort, initials, num, pct } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn, monthlyPoints } from '../store.js';
import { pageHead, sectionHead } from '../ui/blocks.js';
import { countdownInline } from '../ui/countdown.js';

const ui = { tab: 'monthly' };

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

/**
 * Dotation du mois, en centimes. Un point vaut un euro dépensé en packs : la
 * marge derrière les points se déduit de la marge moyenne des packs.
 */
function prizePool() {
  const points = ranking('monthly').reduce((s, r) => s + r.points, 0);
  const margin = (points / RULES.pointsPerEuro) * blendedEdge();
  return Math.round(margin * RULES.leaderboardShare * 100);
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
  const pool = prizePool();
  const [first, second, third, rest] = RULES.leaderboardSplit;
  const tiers = [
    { rank: '1er', icon: 'trophy', tone: 'gold', amount: pool * first },
    { rank: '2e', icon: 'medal', tone: 'silver', amount: pool * second },
    { rank: '3e', icon: 'award', tone: 'bronze', amount: pool * third },
    { rank: '4e – 10e', icon: 'star', tone: '', amount: (pool * rest) / 7, each: true },
  ];
  return `<section class="panel panel--pad">
    ${sectionHead('Dotation du mois', { iconName: 'gift', note: 'Estimation' })}
    <p class="muted">Environ <strong>${eurShort(Math.round(pool / 100) * 100)}</strong> à ce jour, versés en crédits. Viser le classement coûte toujours plus que ce qu'il rapporte.</p>
    <div class="grid-4">
      ${tiers
        .map(
          (r) => `<article class="reward ${r.tone ? `reward--${r.tone}` : ''}">
            <span class="reward__ico">${icon(r.icon, { size: 30 })}</span>
            <span class="reward__rank">${r.rank}</span>
            <h3>${eur(Math.round(r.amount))}</h3>
            <p class="muted small">${r.each ? 'chacun, en crédits' : 'en crédits'}</p>
          </article>`,
        )
        .join('')}
    </div>
  </section>`;
}

export default {
  nav: 'classement',
  title: 'Classement',
  render() {
    const tabs = [
      ['monthly', 'Mensuel'],
      ['total', 'Total'],
      ['rewards', 'Dotation'],
    ];
    return `
    ${pageHead({ icon: 'trophy', title: 'Classement des collectionneurs' })}

    <p class="rule-line">
      <span>${icon('package', { size: 16 })}<strong>1 € de packs = 1 point</strong></span>
      <span>${icon('clock', { size: 16 })}Remise à zéro dans ${countdownInline(nextMonthStart(), 'long')}</span>
      <span>${icon('gift', { size: 16 })}Dotation : ${pct(RULES.leaderboardShare * 100)} de la marge du mois</span>
    </p>

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
