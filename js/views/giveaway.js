// Détail d'un giveaway : compte à rebours, participation, activité, lots.

import { BRAND } from '../config.js';
import { cardRef } from '../catalog.js';
import { giveawayActivity, giveawayParticipants, pastWinners } from '../data/community.js';
import { giveawayById, isActive } from '../data/giveaways.js';
import { packBySlug } from '../data/packs.js';
import { ago, dateFr, dateTimeFr, esc, eur, eurShort, num } from '../format.js';
import { icon } from '../icons.js';
import { giveawayEntry, isLoggedIn, updateGiveaway } from '../store.js';
import { emptyState, sectionHead } from '../ui/blocks.js';
import { cardImage } from '../ui/card.js';
import { countdownBlocks } from '../ui/countdown.js';
import { toast } from '../ui/modal.js';

const ACTIVITY = {
  join: { icon: 'user-plus', text: () => 'a rejoint le giveaway' },
  follow: { icon: 'heart', text: () => `suit ${BRAND.name}` },
  open: { icon: 'package', text: (g) => `a ouvert un ${packBySlug(g.pack)?.name || 'pack'}` },
};

function condition(done, label, action = '') {
  return `<li class="cond ${done ? 'is-done' : ''}">
    <span class="cond__ico">${icon(done ? 'circle-check' : 'clock', { size: 18 })}</span>
    <span class="cond__label">${label}</span>${action}
  </li>`;
}

function participation(g, active) {
  if (!active) {
    const winners = pastWinners(g.id, g.lots.length);
    return `<section class="panel panel--pad">
      ${sectionHead('Résultats', { iconName: 'award', note: 'Gagnants fictifs' })}
      <ol class="winners">
        ${g.lots.map((c, i) => `<li><span class="winners__rank">${i + 1}</span><span class="winners__who">${esc(winners[i] || '—')}</span><span class="muted">${esc(c.name)} · ${eur(c.value)}</span></li>`).join('')}
      </ol>
    </section>`;
  }
  const pack = packBySlug(g.pack);
  if (!isLoggedIn()) {
    return `<section class="panel panel--pad">
      ${sectionHead('Ta participation', { iconName: 'list-checks' })}
      <div class="join">
        <p>Connecte-toi pour participer et suivre tes deux conditions : ouvrir un ${esc(pack?.name || 'pack')} et suivre ${esc(BRAND.name)}.</p>
        <a class="btn btn--primary" href="#/connexion?redirect=${encodeURIComponent(`/giveaways/${g.id}`)}">${icon('gift', { size: 18 })}Participer au giveaway</a>
      </div>
    </section>`;
  }
  const entry = giveawayEntry(g.id);
  const hasTicket = entry.tickets > 0;
  const valid = entry.joined && hasTicket && entry.followed;
  return `<section class="panel panel--pad">
    ${sectionHead('Ta participation', { iconName: 'list-checks' })}
    <ul class="conds">
      ${condition(entry.joined, 'Rejoindre le giveaway', entry.joined ? '' : `<button class="btn btn--primary btn--sm" type="button" data-join>Rejoindre</button>`)}
      ${condition(hasTicket, `Ouvrir un ${esc(pack?.name || 'pack')} <span class="muted">· ${num(entry.tickets)} ticket${entry.tickets > 1 ? 's' : ''}</span>`, pack ? `<a class="btn btn--secondary btn--sm" href="#/packs/${pack.slug}">Ouvrir un pack</a>` : '')}
      ${condition(entry.followed, `Suivre ${esc(BRAND.name)} <span class="muted">· simulé en démo</span>`, entry.followed ? '' : `<button class="btn btn--secondary btn--sm" type="button" data-follow>Suivre</button>`)}
    </ul>
    <p class="join__status ${valid ? 'is-ok' : ''}">${icon(valid ? 'badge-check' : 'info', { size: 18 })}${valid ? `Ta participation est validée : ${num(entry.tickets)} ticket${entry.tickets > 1 ? 's' : ''} dans le tirage.` : 'Remplis les trois conditions pour valider ta participation.'}</p>
  </section>`;
}

export default {
  nav: 'giveaways',
  title: (ctx) => giveawayById(ctx.params.id)?.title || 'Giveaway introuvable',
  render({ params }) {
    const now = Date.now();
    const g = giveawayById(params.id, now);
    if (!g) return emptyState({ iconName: 'gift', title: 'Giveaway introuvable', action: '<a class="btn btn--primary" href="#/giveaways">Tous les giveaways</a>' });
    const active = isActive(g, now);
    const [first, ...rest] = g.lots;
    const feed = giveawayActivity(g, 14, now);

    return `
    <a class="back-link" href="#/giveaways">${icon('arrow-left', { size: 16 })}Tous les giveaways</a>

    <header class="gw-hero">
      <div class="gw-hero__cards" aria-hidden="true">${g.lots.slice(0, 5).map((c) => cardImage(c, { lazy: false })).join('')}</div>
      <h1>${esc(g.title)}</h1>
      <p class="page-head__lead">${esc(g.intro)} ${active ? `Fin le ${dateFr(g.end)}.` : `Clos le ${dateFr(g.end)}.`}</p>
    </header>

    ${
      active
        ? `<div class="panel panel--pad gw-clock">${icon('clock', { size: 22 })}<div><span class="muted small">Clôture dans :</span>${countdownBlocks(g.end)}</div><p class="muted small gw-clock__draw">Tirage au sort le ${dateTimeFr(g.drawAt)}</p></div>`
        : ''
    }

    <div class="stats">
      <div class="stat"><span class="stat__label">${icon('circle-dollar-sign', { size: 16 })}Valeur totale</span><strong class="stat__value">${eurShort(g.total)}</strong></div>
      <div class="stat"><span class="stat__label">${icon('gift', { size: 16 })}Lots</span><strong class="stat__value">${g.lots.length}</strong></div>
      <div class="stat"><span class="stat__label">${icon('users', { size: 16 })}Participants</span><strong class="stat__value">${num(giveawayParticipants(g, now))}</strong><span class="stat__hint">simulé</span></div>
    </div>

    ${participation(g, active)}

    ${
      active
        ? `<section class="panel panel--pad">
            ${sectionHead('Activité en direct', { iconName: 'activity', note: 'Flux simulé' })}
            <ul class="feed">
              ${feed.map((ev) => `<li class="feed__row">${icon(ACTIVITY[ev.type].icon, { size: 16 })}<span><strong>${esc(ev.pseudo)}</strong> ${ACTIVITY[ev.type].text(g)}</span><time>${ago(ev.at, now)}</time></li>`).join('')}
            </ul>
          </section>`
        : ''
    }

    <section class="panel panel--pad">
      ${sectionHead(`${g.lots.length} lots à gagner`, { iconName: 'trophy' })}
      <article class="lot-first">
        <span class="lot-first__img">${cardImage(first, { hi: true })}</span>
        <div>
          <span class="badge badge--gold">${icon('trophy', { size: 13 })}1er lot</span>
          <h3>${esc(first.name)} <span class="muted">${esc(cardRef(first))}</span></h3>
          <p class="muted">${esc(first.set)}</p>
          <p class="lot-first__value">${eur(first.value)}</p>
        </div>
      </article>
      <div class="lots">
        ${rest
          .map(
            (c, i) => `<article class="lot">
              ${cardImage(c)}
              <span class="lot__rank">Lot n°${i + 2}</span>
              <span class="lot__name">${esc(c.name)}</span>
              <span class="lot__value">${eur(c.value)}</span>
              <span class="lot__set">${esc(c.set)}</span>
            </article>`,
          )
          .join('')}
      </div>
      <p class="muted small center">${g.lots.length} lots au total · cotes indicatives</p>
    </section>`;
  },
  mount(root, { params, rerender }) {
    const onClick = (e) => {
      const patch = e.target.closest('[data-join]') ? { joined: true } : e.target.closest('[data-follow]') ? { followed: true } : null;
      if (!patch) return;
      const res = updateGiveaway(params.id, patch);
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      toast(patch.joined ? 'Tu participes au giveaway.' : 'Condition validée.', 'success');
      rerender();
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  },
};
