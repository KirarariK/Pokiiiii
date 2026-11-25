// Récompenses : récompense du jour et badges de progression.

import { RULES } from '../config.js';
import { BADGES } from '../data/badges.js';
import { TICKETS } from '../fair.js';
import { esc, eur, num, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { badgeProgress, claimDaily, dailyAvailable, getState, isLoggedIn } from '../store.js';
import { note, pageHead } from '../ui/blocks.js';
import { countdownInline } from '../ui/countdown.js';
import { burst, countUp, sfx } from '../ui/effects.js';
import { toast } from '../ui/modal.js';

/** Dernière récompense obtenue pendant cette visite, pour l'afficher après le tirage. */
let lastClaim = null;

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d.getTime();
}

function dailyPanel() {
  const logged = isLoggedIn();
  const { current } = badgeProgress();
  const mult = logged ? current.daily : 1;
  const average = RULES.dailyReward.reduce((s, [amount, tickets]) => s + (amount * tickets) / TICKETS, 0) * mult;
  const available = logged && dailyAvailable();

  const action = !logged
    ? `<a class="btn btn--primary btn--lg" href="#/connexion?redirect=%2Frecompenses">${icon('log-in', { size: 18 })}Me connecter pour la récupérer</a>`
    : available
      ? `<button class="btn btn--primary btn--lg" type="button" data-claim>${icon('gift', { size: 20 })}Récupérer ma récompense</button>`
      : `<p class="daily__wait">${icon('clock', { size: 18 })}Prochaine récompense dans ${countdownInline(nextMidnight(), 'long', 'lock__time')}</p>`;

  return `<section class="panel daily">
    <canvas class="daily__fx" aria-hidden="true"></canvas>
    <div class="daily__main">
      <p class="eyebrow">${icon('calendar-check', { size: 15 })}Une fois par jour</p>
      <h2>Récompense du jour</h2>
      ${
        lastClaim
          ? `<p class="daily__amount"><span data-amount>${eur(0)}</span></p>
             <p class="muted">Crédités sur ton solde${lastClaim.multiplier > 1 ? ` (${eur(lastClaim.base)} × ${lastClaim.multiplier.toLocaleString('fr-FR')} grâce à ton badge)` : ''}. Ticket n° ${num(lastClaim.ticket)} · <a href="#/equite">vérifier</a></p>`
          : `<p class="muted">Un tirage gratuit par jour : de ${eur(RULES.dailyReward[0][0] * mult)} à ${eur(RULES.dailyReward[RULES.dailyReward.length - 1][0] * mult)} de crédits${logged ? ` avec ton ${esc(current.name)}` : ''}. En moyenne ${eur(Math.round(average))}.</p>`
      }
      ${action}
      ${logged && getState().daily.streak > 1 ? `<p class="small muted">${icon('flame', { size: 14 })} ${getState().daily.streak} jours d'affilée</p>` : ''}
    </div>
    <table class="table daily__table">
      <thead><tr><th>Gain</th><th class="num">Probabilité</th></tr></thead>
      <tbody>
        ${RULES.dailyReward.map(([amount, tickets]) => `<tr><td>${eur(Math.round(amount * mult))}</td><td class="num">${pctFine(tickets / TICKETS)}</td></tr>`).join('')}
      </tbody>
    </table>
  </section>`;
}

function badgesPanel() {
  const logged = isLoggedIn();
  const xp = logged ? getState().xp : 0;
  const { current, next, ratio } = badgeProgress();
  return `<section class="panel panel--pad">
    <div class="section__head"><h2>${icon('award', { size: 22 })}<span>Badges</span></h2>${logged ? `<span class="badge badge--info">${num(xp)} XP</span>` : ''}</div>
    <p class="muted">1 € engagé = 1 XP (achat de pack, carte misée en Évolution). Chaque badge augmente ta récompense du jour.</p>
    ${
      logged && next
        ? `<div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}" aria-label="Avancement vers ${esc(next.name)}">
             <span class="xpbar__fill" style="width:${Math.round(ratio * 100)}%"></span>
           </div>
           <p class="small muted">Encore <strong>${num(next.xp - xp)} XP</strong> avant le ${esc(next.name)}.</p>`
        : ''
    }
    <ol class="badges">
      ${BADGES.map((b) => {
        const reached = logged && xp >= b.xp;
        const isCurrent = logged && b.id === current.id;
        return `<li class="badge-row ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}">
          <span class="badge-row__ico" data-theme="${b.theme}">${icon(b.icon, { size: 22 })}</span>
          <span class="badge-row__name"><strong>${esc(b.name)}</strong><small>${b.xp ? `à partir de ${num(b.xp)} XP` : 'dès le premier pack'}</small></span>
          <span class="badge-row__perk">Récompense du jour ×${b.daily.toLocaleString('fr-FR')}</span>
          ${isCurrent ? '<span class="badge badge--me">Ton badge</span>' : reached ? icon('check', { size: 18 }) : icon('lock', { size: 16 })}
        </li>`;
      }).join('')}
    </ol>
  </section>`;
}

export default {
  nav: 'recompenses',
  title: 'Récompenses',
  render() {
    return `
    ${pageHead({ icon: 'calendar-check', title: 'Récompenses', lead: 'Une récompense gratuite chaque jour, et des badges qui la font grossir à mesure que tu joues.' })}
    ${dailyPanel()}
    ${badgesPanel()}
    ${note("Démonstration : les crédits offerts sont fictifs. En production, un bonus s'accompagne de conditions d'utilisation à afficher ici.", 'demo')}`;
  },
  mount(root, { rerender }) {
    if (lastClaim && !lastClaim.shown) {
      lastClaim.shown = true;
      countUp(root.querySelector('[data-amount]'), lastClaim.amount, eur, 900);
      burst(root.querySelector('.daily__fx'), { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(), count: lastClaim.base >= 250 ? 160 : 60, power: 1.1 });
      sfx.coins();
    } else if (lastClaim) {
      const el = root.querySelector('[data-amount]');
      if (el) el.textContent = eur(lastClaim.amount);
    }
    const onClick = (e) => {
      if (!e.target.closest('[data-claim]')) return;
      const res = claimDaily();
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      lastClaim = { ...res, shown: false };
      rerender();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
