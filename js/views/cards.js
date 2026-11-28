// Cartes : le coffre en direct, et tout le catalogue à la demande.
// Pour chaque carte : est-elle au coffre, et de quels packs peut-elle sortir, à quelle probabilité.

import { cardRef, dropsOfCard, stockCard, stockCards } from '../catalog.js';
import { fold, loadCatalogue } from '../catalogue.js';
import { PACKS } from '../data/packs.js';
import { esc, eur, num, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { qtyOf } from '../stock.js';
import { emptyState, pageHead } from '../ui/blocks.js';
import { cardImage, cardTile } from '../ui/card.js';
import { openModal } from '../ui/modal.js';

const STEP = 60;

/** Recherche et filtres, gardés tant qu'on reste sur le site. */
const ui = { q: '', scope: 'vault', sort: 'value', shown: STEP, cat: null, failed: false };

/** Texte de recherche d'une carte du coffre (celles du catalogue l'ont déjà). */
const haystack = (c) => c.q || fold(`${c.name} ${c.nameEn} ${c.set} ${c.code} ${c.number}`);

function list() {
  const q = fold(ui.q.trim());
  const source = ui.scope === 'all' && ui.cat ? ui.cat.cards : stockCards();
  const out = q ? source.filter((c) => haystack(c).includes(q)) : [...source];
  if (ui.sort === 'name') out.sort((a, b) => a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id));
  else if (ui.sort === 'low') out.sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
  else out.sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  return out;
}

function tile(card) {
  const live = stockCard(card.id);
  const qty = qtyOf(card.id);
  const shown = live || card;
  return cardTile(shown, {
    tag: 'button',
    attrs: `type="button" data-card="${esc(card.id)}"`,
    cls: qty ? '' : 'is-out',
    showValue: shown.value > 0,
    extra: qty ? `<span class="tile__status">${icon('archive', { size: 13 })}×${num(qty)} au coffre</span>` : `<span class="tile__status tile__status--off">Pas au coffre</span>`,
  });
}

function grid() {
  if (ui.scope === 'all' && !ui.cat) return ui.failed ? emptyState({ iconName: 'triangle-alert', title: 'Catalogue indisponible', text: 'Réessaie dans un instant.' }) : `<p class="muted center">Chargement du catalogue…</p>`;
  const cards = list();
  if (!cards.length) return emptyState({ iconName: 'search', title: 'Aucune carte', text: ui.scope === 'vault' ? 'Rien au coffre pour cette recherche. Essaie dans tout le catalogue.' : 'Aucune carte ne porte ce nom.' });
  const more = cards.length - ui.shown;
  return `
    <p class="muted small">${num(cards.length)} ${cards.length > 1 ? 'cartes' : 'carte'}</p>
    <div class="tile-grid">${cards.slice(0, ui.shown).map(tile).join('')}</div>
    ${more > 0 ? `<button class="btn btn--secondary" type="button" data-more>${icon('chevron-down', { size: 16 })}Afficher ${num(Math.min(STEP, more))} de plus</button>` : ''}`;
}

function openCard(card) {
  const live = stockCard(card.id);
  const shown = live || card;
  const qty = qtyOf(card.id);
  const drops = dropsOfCard(card.id, PACKS);
  openModal({
    title: shown.name,
    size: 'lg',
    body: `<div class="detail">
      <div class="detail__art"><span class="detail__card">${cardImage(shown, { hi: true, lazy: false })}</span></div>
      <div class="detail__info">
        <p class="muted">${shown.name !== shown.nameEn ? `${esc(shown.nameEn)} · ` : ''}${esc(shown.set)} · ${esc(cardRef(shown))}</p>
        <p class="detail__value">${shown.value ? eur(shown.value) : 'Cote inconnue'}</p>
        <p>${qty ? `<span class="badge badge--stock">${icon('archive', { size: 13 })}×${num(qty)} au coffre</span>` : `<span class="badge badge--out">Pas au coffre</span>`}</p>
        <h3>Où elle sort</h3>
        ${
          drops.length
            ? `<ul class="where">${drops
                .map(
                  ({ pack, p }) => `<li>
                    <a href="#/packs/${pack.slug}" data-close>${esc(pack.name)}<small>${eur(pack.price)}</small></a>
                    <span><strong>${pctFine(p)}</strong><small>1 sur ${num(Math.round(1 / p))}</small></span>
                  </li>`,
                )
                .join('')}</ul>`
            : `<p class="muted">${qty ? "Aucun pack ne la propose en ce moment." : 'Elle ne peut sortir que si elle est au coffre.'}</p>`
        }
      </div>
    </div>`,
  });
}

export default {
  nav: 'cartes',
  title: 'Cartes',
  render({ query }) {
    if (typeof query.q === 'string' && query.q !== ui.lastQuery) {
      // Recherche lancée depuis la barre du haut.
      ui.q = query.q;
      ui.lastQuery = query.q;
      ui.shown = STEP;
    }
    const tab = (key, label) => `<button class="tab ${ui.scope === key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.scope === key}" data-scope="${key}">${label}</button>`;
    return `
    ${pageHead({ icon: 'library', title: 'Cartes' })}
    <div class="toolbar">
      <div class="tabs" role="tablist" aria-label="Périmètre">
        ${tab('vault', `Au coffre <span class="tab__count">${num(stockCards().length)}</span>`)}
        ${tab('all', 'Tout le catalogue')}
      </div>
      <div class="toolbar__filters cards__filters">
        <input class="input" type="search" placeholder="Rechercher une carte" value="${esc(ui.q)}" data-q aria-label="Rechercher une carte">
        <select class="input input--sm" data-sort aria-label="Tri">
          <option value="value" ${ui.sort === 'value' ? 'selected' : ''}>Les plus cotées</option>
          <option value="low" ${ui.sort === 'low' ? 'selected' : ''}>Les moins cotées</option>
          <option value="name" ${ui.sort === 'name' ? 'selected' : ''}>Par nom</option>
        </select>
      </div>
    </div>
    <div class="stack" data-grid>${grid()}</div>`;
  },
  mount(root, { rerender }) {
    let alive = true;
    let timer = 0;
    const paint = () => {
      root.querySelector('[data-grid]').innerHTML = grid();
    };
    const needCatalogue = () => {
      if (ui.cat || ui.failed) return;
      loadCatalogue()
        .then((cat) => {
          ui.cat = cat;
        })
        .catch(() => {
          ui.failed = true;
        })
        .finally(() => alive && ui.scope === 'all' && paint());
    };
    if (ui.scope === 'all') needCatalogue();

    const find = (id) => stockCard(id) || ui.cat?.cards.find((c) => c.id === id);
    const onClick = (e) => {
      const scope = e.target.closest('[data-scope]');
      if (scope) {
        ui.scope = scope.dataset.scope;
        ui.shown = STEP;
        if (ui.scope === 'all') needCatalogue();
        rerender();
        return;
      }
      if (e.target.closest('[data-more]')) {
        ui.shown += STEP;
        paint();
        return;
      }
      const el = e.target.closest('[data-card]');
      const card = el && find(el.dataset.card);
      if (card) openCard(card);
    };
    const onInput = (e) => {
      if (!e.target.matches('[data-q]')) return;
      ui.q = e.target.value;
      ui.shown = STEP;
      clearTimeout(timer);
      timer = setTimeout(paint, 160);
    };
    const onChange = (e) => {
      if (!e.target.matches('[data-sort]')) return;
      ui.sort = e.target.value;
      paint();
    };
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onChange);
    return () => {
      alive = false;
      clearTimeout(timer);
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onChange);
    };
  },
};
