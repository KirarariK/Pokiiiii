// Récompenses : cagnotte de cashback et badges de progression.
//
// Le cashback est une part de la marge théorique du site sur les mises du
// joueur. Rien n'est offert à fonds perdus : la cagnotte ne grossit que si le
// joueur joue, et la roue qui permet de la multiplier a une moyenne de ×1.

import { RULES } from '../config.js';
import { BADGES } from '../data/badges.js';
import { TICKETS } from '../fair.js';
import { esc, eur, num, pct, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { badgeProgress, cashbackAvailable, cashbackPot, claimCashback, getState, isLoggedIn } from '../store.js';
import { note, pageHead } from '../ui/blocks.js';
import { burst, countUp, sfx } from '../ui/effects.js';
import { toast } from '../ui/modal.js';

/** Dernier encaissement de cette visite, pour l'afficher après coup. */
let lastClaim = null;

const times = (x) => `×${x.toLocaleString('fr-FR')}`;

function cashbackPanel() {
  const logged = isLoggedIn();
  const { current } = badgeProgress();
  const pot = logged ? cashbackPot() : 0;
  const ready = logged && cashbackAvailable();
  const missing = RULES.cashback.minimum - pot;

  const actions = !logged
    ? `<a class="btn btn--primary btn--lg" href="#/connexion?redirect=%2Frecompenses">${icon('log-in', { size: 18 })}Me connecter</a>`
    : `<div class="daily__actions">
         <button class="btn btn--primary btn--lg" type="button" data-claim="cash" ${ready ? '' : 'disabled'}>${icon('hand-coins', { size: 20 })}Encaisser ${eur(pot)}</button>
         <button class="btn btn--secondary btn--lg" type="button" data-claim="wheel" ${ready ? '' : 'disabled'}>${icon('dices', { size: 20 })}Tenter la roue</button>
       </div>
       ${ready ? '' : `<p class="small muted">Encore ${eur(missing)} avant de pouvoir encaisser (minimum ${eur(RULES.cashback.minimum)}). La cagnotte grossit à chaque pack ouvert et à chaque évolution tentée.</p>`}`;

  return `<section class="panel daily">
    <canvas class="daily__fx" aria-hidden="true"></canvas>
    <div class="daily__main">
      <p class="eyebrow">${icon('hand-coins', { size: 15 })}Cashback</p>
      <h2>Ta cagnotte</h2>
      ${
        lastClaim
          ? `<p class="daily__amount"><span data-amount>${eur(0)}</span></p>
             <p class="muted">Crédités sur ton solde${lastClaim.ticket != null ? ` : la roue a donné ${times(lastClaim.factor)} sur ${eur(lastClaim.base)}. Ticket n° ${num(lastClaim.ticket)} · <a href="#/equite">vérifier</a>` : '.'}</p>`
          : `<p class="daily__amount">${eur(pot)}</p>`
      }
      <p class="muted">${logged ? `Ton ${esc(current.name)} te reverse` : 'Chaque joueur récupère de'} <strong>${logged ? pct(current.cashback * 100) : `${pct(BADGES[0].cashback * 100)} à ${pct(BADGES[BADGES.length - 1].cashback * 100)}`}</strong> de la marge du site sur ${logged ? 'tes' : 'ses'} mises. Tu peux encaisser le montant tel quel, ou le jouer à la roue.</p>
      ${actions}
    </div>
    <div class="daily__side">
      <table class="table daily__table">
        <thead><tr><th>Roue</th><th class="num">Probabilité</th></tr></thead>
        <tbody>
          ${RULES.cashback.wheel.map(([mult, tickets]) => `<tr><td>${times(mult)}</td><td class="num">${pctFine(tickets / TICKETS)}</td></tr>`).join('')}
        </tbody>
      </table>
      <p class="small muted">En moyenne ×1 : sur la durée, la roue ne change pas ce que tu touches, seulement la façon de le toucher.</p>
    </div>
  </section>`;
}

function badgesPanel() {
  const logged = isLoggedIn();
  const xp = logged ? Math.floor(getState().xp) : 0;
  const { current, next, ratio } = badgeProgress();
  return `<section class="panel panel--pad">
    <div class="section__head"><h2>${icon('award', { size: 22 })}<span>Badges</span></h2>${logged ? `<span class="badge badge--info">${num(xp)} XP</span>` : ''}</div>
    <p class="muted">L'XP suit la marge du site sur tes mises : 1 € misé sur un pack à 10 % de marge rapporte 1 XP. Chaque badge augmente ta part de cashback.</p>
    ${
      logged && next
        ? `<div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(ratio * 100)}" aria-label="Avancement vers ${esc(next.name)}">
             <span class="xpbar__fill" style="width:${Math.round(ratio * 100)}%"></span>
           </div>
           <p class="small muted">Encore <strong>${num(Math.ceil(next.xp - getState().xp))} XP</strong> avant le ${esc(next.name)}.</p>`
        : ''
    }
    <ol class="badges">
      ${BADGES.map((b) => {
        const reached = logged && xp >= b.xp;
        const isCurrent = logged && b.id === current.id;
        return `<li class="badge-row ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}">
          <span class="badge-row__ico" data-theme="${b.theme}">${icon(b.icon, { size: 22 })}</span>
          <span class="badge-row__name"><strong>${esc(b.name)}</strong><small>${b.xp ? `à partir de ${num(b.xp)} XP` : 'dès le premier pack'}</small></span>
          <span class="badge-row__perk">Cashback : ${pct(b.cashback * 100)} de la marge</span>
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
    ${pageHead({ icon: 'hand-coins', title: 'Récompenses', lead: 'Une part de la marge du site sur tes mises te revient, et grossit avec tes badges.' })}
    ${cashbackPanel()}
    ${badgesPanel()}
    ${note("Le cashback rend une partie de ce que le jeu coûte en moyenne : il ne rend jamais le jeu gagnant. Démonstration : les crédits sont fictifs.", 'demo')}`;
  },
  mount(root, { rerender }) {
    if (lastClaim && !lastClaim.shown) {
      lastClaim.shown = true;
      countUp(root.querySelector('[data-amount]'), lastClaim.amount, eur, 900);
      burst(root.querySelector('.daily__fx'), { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(), count: lastClaim.factor >= 2 ? 160 : 60, power: 1.1 });
      sfx.coins();
    } else if (lastClaim) {
      const el = root.querySelector('[data-amount]');
      if (el) el.textContent = eur(lastClaim.amount);
    }
    const onClick = (e) => {
      const btn = e.target.closest('[data-claim]');
      if (!btn) return;
      const res = claimCashback(btn.dataset.claim);
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      lastClaim = { ...res, shown: false };
      rerender();
    };
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      // En quittant la page, le dernier encaissement n'est plus affiché.
      if (!location.hash.startsWith('#/recompenses')) lastClaim = null;
    };
  },
};
