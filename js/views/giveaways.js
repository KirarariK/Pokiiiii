// Liste des giveaways : en cours et terminés.

import { giveawayParticipants } from '../data/community.js';
import { isActive, listGiveaways } from '../data/giveaways.js';
import { dateFr, esc, eurShort, num } from '../format.js';
import { icon } from '../icons.js';
import { emptyState, pageHead } from '../ui/blocks.js';
import { cardImage } from '../ui/card.js';
import { countdownBlocks } from '../ui/countdown.js';

const ui = { tab: 'actifs', sort: 'value' };

function giveawayCard(g, active) {
  return `<article class="panel gw-card">
    <div class="gw-card__top">
      <div>
        <h2>${esc(g.title)}</h2>
        <p class="gw-card__value">${eurShort(g.total)} de lots · ${g.lots.length} gagnants</p>
      </div>
      ${active && g.hot ? `<span class="badge badge--hot">${icon('flame', { size: 13 })}Hot</span>` : ''}
      ${!active ? `<span class="badge badge--info">Terminé</span>` : ''}
    </div>
    <div class="gw-card__lots">
      ${g.lots
        .slice(0, 9)
        .map((c) => `<span class="gw-lot">${cardImage(c)}<span class="gw-lot__name">${esc(c.name)}</span></span>`)
        .join('')}
    </div>
    <div class="gw-card__foot">
      ${
        active
          ? `<div><span class="muted small">Clôture dans :</span>${countdownBlocks(g.end, { seconds: false })}</div>`
          : `<p class="muted">Clos le ${dateFr(g.end)} · ${num(giveawayParticipants(g))} participants</p>`
      }
      <a class="btn ${active ? 'btn--primary' : 'btn--secondary'} btn--lg" href="#/giveaways/${g.id}">${active ? 'Voir le giveaway' : 'Voir les résultats'}${icon('arrow-right', { size: 18 })}</a>
    </div>
  </article>`;
}

export default {
  nav: 'giveaways',
  title: 'Giveaways',
  render() {
    const now = Date.now();
    const all = listGiveaways(now);
    const active = ui.tab === 'actifs';
    const list = all
      .filter((g) => isActive(g, now) === active)
      .sort((a, b) => (ui.sort === 'value' ? b.total - a.total : a.end - b.end));
    return `
    ${pageHead({ icon: 'gift', title: 'Giveaways', lead: 'Les tirages au sort en cours et passés.' })}
    <div class="toolbar">
      <div class="tabs" role="tablist" aria-label="Giveaways">
        <button class="tab ${active ? 'is-active' : ''}" type="button" role="tab" aria-selected="${active}" data-tab="actifs">Actifs</button>
        <button class="tab ${!active ? 'is-active' : ''}" type="button" role="tab" aria-selected="${!active}" data-tab="historique">Historique</button>
      </div>
      <label class="toolbar__filters"><span class="muted small">Trier par</span>
        <select class="input input--sm" data-sort>
          <option value="value" ${ui.sort === 'value' ? 'selected' : ''}>Valeur la plus élevée</option>
          <option value="end" ${ui.sort === 'end' ? 'selected' : ''}>Date de clôture</option>
        </select>
      </label>
    </div>
    <div class="stack">
      ${list.length ? list.map((g) => giveawayCard(g, active)).join('') : emptyState({ iconName: 'gift', title: active ? 'Aucun giveaway en cours' : 'Aucun giveaway terminé', text: 'Reviens bientôt.' })}
    </div>`;
  },
  mount(root, { rerender }) {
    const onClick = (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      ui.tab = tab.dataset.tab;
      rerender();
    };
    const onChange = (e) => {
      if (!e.target.matches('[data-sort]')) return;
      ui.sort = e.target.value;
      rerender();
    };
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
    };
  },
};
