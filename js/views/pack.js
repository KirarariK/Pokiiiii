// Page d'un pack : visuel, répartitions, achat, plus grosses cartes, dernières ouvertures.

import { RULES } from '../config.js';
import { topHits } from '../catalog.js';
import { recentOpenings } from '../data/community.js';
import { giveawayById, isActive } from '../data/giveaways.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { esc, eur, plural } from '../format.js';
import { icon } from '../icons.js';
import { buyPacks, getState, giveawayEntry, isLoggedIn } from '../store.js';
import { emptyState, note, oddsGrid, openingItem, sectionHead } from '../ui/blocks.js';
import { cardTile } from '../ui/card.js';
import { countdownInline } from '../ui/countdown.js';
import { attachTilt, sfx } from '../ui/effects.js';
import { confirmDialog, toast } from '../ui/modal.js';
import { packArt, themeGlow } from '../ui/pack-art.js';
import { openTopup } from '../ui/topup.js';

function giveawayBox(pack) {
  if (!pack.giveaway) return '';
  const g = giveawayById(pack.giveaway);
  if (!g || !isActive(g)) return '';
  const tickets = isLoggedIn() ? giveawayEntry(g.id).tickets : null;
  return `<div class="buy__gw">
    <div class="buy__gw-row">
      <span>${icon('ticket', { size: 16 })}Tes tickets</span>
      <strong>${tickets == null ? '–' : tickets}</strong>
    </div>
    <div class="buy__gw-row">
      <span>${icon('clock', { size: 16 })}Clôture dans</span>
      <strong>${countdownInline(g.end, 'long')}</strong>
    </div>
    <p class="small muted">1 pack = 1 ticket pour le <a href="#/giveaways/${g.id}">${esc(g.title)}</a>.</p>
  </div>`;
}

export default {
  nav: 'packs',
  title: (ctx) => packBySlug(ctx.params.slug)?.name || 'Pack introuvable',
  render({ params, query }) {
    const pack = packBySlug(params.slug);
    if (!pack) {
      return emptyState({ title: 'Pack introuvable', text: "Ce pack n'existe pas ou n'est plus proposé.", action: '<a class="btn btn--primary" href="#/packs">Voir les packs</a>' });
    }
    const qty = Math.min(RULES.maxPacksPerOrder, Math.max(1, Number.parseInt(query.qty, 10) || 1));
    const others = PACKS.filter((p) => p.slug !== pack.slug);
    const hits = topHits(pack, 10);
    const pulls = recentOpenings(pack.slug, 5);

    return `
    <a class="back-link" href="#/packs">${icon('arrow-left', { size: 16 })}Tous les packs</a>
    <div class="pack-page" style="--glow:${themeGlow(pack.theme)}">
      <div class="pack-page__left">
        <div class="pack-stage">
          <span class="badge badge--stock">${icon('check', { size: 13 })}En stock</span>
          ${pack.event ? `<span class="badge badge--event">${icon('flame', { size: 13 })}Événement</span>` : ''}
          <span class="pack-stage__glow"></span>
          <span class="pack-stage__art" data-tilt>${packArt(pack)}</span>
        </div>
        <div class="others">
          <h2 class="others__title">Autres boosters</h2>
          <div class="others__row">
            ${others
              .map(
                (p) => `<a class="other" href="#/packs/${p.slug}" title="${esc(p.name)}" style="--glow:${themeGlow(p.theme)}">
                  ${packArt(p)}<span class="other__price">${eur(p.price)}</span>
                </a>`,
              )
              .join('')}
          </div>
        </div>
      </div>

      <section class="buy panel" aria-labelledby="pack-title">
        <p class="eyebrow">${esc(pack.tagline)}</p>
        <h1 id="pack-title">${esc(pack.name)}</h1>
        ${giveawayBox(pack)}
        <p class="buy__desc">${esc(pack.desc)}</p>

        <h2 class="buy__sub">Répartitions</h2>
        ${oddsGrid(pack)}
        <p class="small muted">Probabilité d'obtenir une carte dont la cote tombe dans chaque palier. <a href="#/transparence">Comment le tirage fonctionne</a></p>

        <div class="buy__qty">
          <span id="qty-label">Quantité de packs</span>
          <div class="stepper" role="group" aria-labelledby="qty-label">
            <button class="btn btn--icon btn--secondary" type="button" data-step="-1" aria-label="Un pack de moins">${icon('minus', { size: 18 })}</button>
            <output class="stepper__value" data-qty aria-live="polite">${qty}</output>
            <button class="btn btn--icon btn--secondary" type="button" data-step="1" aria-label="Un pack de plus">${icon('plus', { size: 18 })}</button>
          </div>
          <span class="small muted">Maximum ${RULES.maxPacksPerOrder} packs par achat</span>
        </div>

        <button class="btn btn--primary btn--lg btn--block buy__cta" type="button" data-buy>
          ${icon('package-open', { size: 20 })}<span data-buy-label></span>
        </button>
        ${isLoggedIn() ? `<p class="small muted center">Solde : <strong>${eur(getState().balance)}</strong></p>` : `<p class="small muted center">Un compte démo est nécessaire pour ouvrir un pack.</p>`}
      </section>
    </div>

    <section class="section panel panel--pad">
      ${sectionHead('Les plus gros hits', { iconName: 'star' })}
      <div class="tile-grid tile-grid--5">
        ${hits.map(({ card, rarity }) => cardTile(card, { rarity })).join('')}
      </div>
    </section>

    <section class="section panel panel--pad">
      ${sectionHead('Les dernières ouvertures', { iconName: 'zap', note: 'Flux simulé' })}
      <div class="pulls">
        ${pulls.length ? pulls.map((p) => openingItem(p)).join('') : '<p class="muted">Aucune ouverture récente.</p>'}
      </div>
    </section>

    ${note("Démonstration : les cartes tirées ne sont pas adossées à un stock réel et aucune n'est expédiée. Les cotes sont indicatives.", 'demo')}`;
  },

  mount(root, { params, navigate, rerender }) {
    const pack = packBySlug(params.slug);
    if (!pack) return null;

    const out = root.querySelector('[data-qty]');
    const label = root.querySelector('[data-buy-label]');
    let qty = Number(out.textContent) || 1;
    const paint = () => {
      out.textContent = String(qty);
      label.textContent = `Acheter ${plural(qty, 'pack', 'packs')} — ${eur(pack.price * qty)}`;
      root.querySelector('[data-step="-1"]').disabled = qty <= 1;
      root.querySelector('[data-step="1"]').disabled = qty >= RULES.maxPacksPerOrder;
    };
    paint();

    const buy = async () => {
      if (!isLoggedIn()) {
        navigate(`/connexion?mode=inscription&redirect=${encodeURIComponent(`/packs/${pack.slug}?qty=${qty}`)}`);
        return;
      }
      const total = pack.price * qty;
      const balance = getState().balance;
      if (balance < total) {
        openTopup({ need: total - balance, onDone: rerender });
        return;
      }
      const ok = await confirmDialog({
        title: "Confirmer l'achat",
        confirm: 'Acheter et ouvrir',
        body: `<p><strong>${plural(qty, 'pack', 'packs')} ${esc(pack.name)}</strong> pour <strong>${eur(total)}</strong>.</p>
               <p class="muted small">Solde après achat : ${eur(balance - total)} (crédits fictifs). L'achat est définitif : la carte est tirée immédiatement.</p>`,
      });
      if (!ok) return;
      const res = buyPacks(pack.slug, qty);
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      sfx.tap();
      navigate('/ouverture');
    };

    const onClick = (e) => {
      const step = e.target.closest('[data-step]');
      if (step) {
        qty = Math.min(RULES.maxPacksPerOrder, Math.max(1, qty + Number(step.dataset.step)));
        paint();
        return;
      }
      if (e.target.closest('[data-buy]')) buy();
    };
    root.addEventListener('click', onClick);
    const untilt = attachTilt(root.querySelector('[data-tilt]'), 16);
    return () => {
      root.removeEventListener('click', onClick);
      untilt();
    };
  },
};
