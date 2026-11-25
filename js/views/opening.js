// Ouverture des packs achetés : animation carte par carte, puis récapitulatif.
//
// Les cartes sont déjà au coffre au moment où cette page s'affiche (le tirage
// a lieu à l'achat) : l'animation ne fait que les révéler. Quitter la page en
// cours de route ne fait donc rien perdre.

import { RULES } from '../config.js';
import { cardById, cardRef } from '../catalog.js';
import { RARITIES, packBySlug } from '../data/packs.js';
import { esc, eur, plural } from '../format.js';
import { icon } from '../icons.js';
import { buybackOf, getState, markRevealed, ownedByUid, sellCards, setSetting } from '../store.js';
import { emptyState } from '../ui/blocks.js';
import { cardBack, cardTile, rarityBadge } from '../ui/card.js';
import { countdownInline, refreshCountdowns } from '../ui/countdown.js';
import { attachTilt, burst, countUp, motionOk, sfx } from '../ui/effects.js';
import { toast } from '../ui/modal.js';
import { packArt, themeGlow } from '../ui/pack-art.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Carte possédée dont la fiche existe toujours au catalogue. */
const known = (owned) => Boolean(owned && cardById(owned.cardId));

/** Charge une image ; se résout quand elle est prête, ou après `timeout` ms. */
function preload(src, timeout = 3000) {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve(src);
    img.onload = done;
    img.onerror = done;
    img.src = src;
    setTimeout(done, timeout);
  });
}

const soundIcon = () => icon(getState().settings.sound ? 'volume-2' : 'volume-x');

/** Intensité des particules selon la rareté. */
const BURST = { peu_commune: 40, rare: 70, ultra_rare: 110, legendaire: 170 };

function sceneHtml(pack, total) {
  return `
  <section class="opening" data-phase="idle" style="--glow:${themeGlow(pack.theme)}">
    <header class="opening__bar">
      <span class="opening__title"><strong>${esc(pack.name)}</strong><span data-progress></span></span>
      <span class="opening__tools">
        <button class="btn btn--icon btn--ghost" type="button" data-sound aria-label="Activer ou couper le son">${soundIcon()}</button>
        ${total > 1 ? `<button class="btn btn--secondary btn--sm" type="button" data-skip>Tout révéler${icon('skip-forward', { size: 15 })}</button>` : ''}
      </span>
    </header>

    <div class="opening__stage">
      <span class="opening__aura" aria-hidden="true"></span>
      <span class="opening__rays" aria-hidden="true"></span>
      <canvas class="opening__fx" aria-hidden="true"></canvas>
      <button class="opening__pack" type="button" data-open aria-label="Ouvrir le pack">
        <span class="opening__pack-top">${packArt(pack)}</span>
        <span class="opening__pack-body">${packArt(pack)}</span>
      </button>
      <div class="opening__card" data-card hidden>
        <div class="flip" data-tilt>
          <div class="flip__inner">
            <div class="flip__face flip__face--back">${cardBack()}</div>
            <div class="flip__face flip__face--front"><span class="tcg" data-front></span><span class="holo" aria-hidden="true"></span></div>
          </div>
        </div>
      </div>
      <span class="opening__flash" aria-hidden="true"></span>
    </div>

    <p class="opening__hint" data-hint>${icon('sparkles', { size: 16 })}Touche le pack pour l'ouvrir</p>
    <div class="opening__result" data-result hidden aria-live="polite"></div>
  </section>`;
}

function summaryHtml(session, pack, order, lockUntil) {
  const rows = session.map((o) => ({ owned: ownedByUid(o.uid) || o, card: cardById(o.cardId) }));
  const kept = rows.filter((r) => r.owned.status === 'coffre');
  const totalValue = rows.reduce((s, r) => s + r.owned.value, 0);
  const keptBuyback = kept.reduce((s, r) => s + buybackOf(r.owned), 0);
  const best = rows.reduce((top, r) => (!top || r.owned.value > top.owned.value ? r : top), null);
  const locked = Date.now() < lockUntil;

  return `
  <section class="summary">
    <header class="page-head page-head--compact">
      <span class="page-head__ico">${icon('party-popper', { size: 28 })}</span>
      <h1>Ton ouverture</h1>
      <p class="page-head__lead">${plural(order.qty, 'pack', 'packs')} ${esc(pack.name)} · payé ${eur(order.total)}</p>
    </header>

    <div class="stats">
      <div class="stat"><span class="stat__label">${icon('gem', { size: 16 })}Cote totale</span><strong class="stat__value">${eur(totalValue)}</strong></div>
      <div class="stat"><span class="stat__label">${icon('star', { size: 16 })}Meilleure carte</span><strong class="stat__value stat__value--text">${esc(best.card.name)}</strong><span class="stat__hint">${eur(best.owned.value)}</span></div>
      <div class="stat"><span class="stat__label">${icon('hand-coins', { size: 16 })}Rachat des cartes gardées</span><strong class="stat__value">${eur(keptBuyback)}</strong><span class="stat__hint">${Math.round(RULES.buybackRate * 100)} % de la cote</span></div>
    </div>

    <div class="tile-grid tile-grid--5">
      ${rows
        .map(({ owned, card }) =>
          cardTile(card, {
            rarity: owned.rarity,
            value: owned.value,
            extra:
              owned.status === 'coffre'
                ? `<button class="btn btn--secondary btn--sm btn--block" type="button" data-sell="${owned.uid}">Revendre ${eur(buybackOf(owned))}</button>`
                : `<span class="tile__status">${icon('check', { size: 14 })}Revendue ${eur(owned.soldFor)}</span>`,
          }),
        )
        .join('')}
    </div>

    ${locked && kept.length ? `<p class="lock">${icon('timer', { size: 16 })}Prix de rachat garanti encore ${countdownInline(lockUntil, 'mmss', 'lock__time')}</p>` : ''}

    <div class="summary__actions">
      ${kept.length > 1 ? `<button class="btn btn--secondary" type="button" data-sell-all>${icon('hand-coins', { size: 18 })}Tout revendre — ${eur(keptBuyback)}</button>` : ''}
      <a class="btn btn--secondary" href="#/collection">${icon('archive', { size: 18 })}Voir ma collection</a>
      <a class="btn btn--primary" href="#/packs/${pack.slug}">${icon('package', { size: 18 })}Rouvrir un ${esc(pack.short)}</a>
    </div>
  </section>`;
}

export default {
  nav: 'packs',
  title: 'Ouverture',
  auth: true,
  immersive: true,

  render() {
    const { pending, lastOrder } = getState();
    const queue = pending.map(ownedByUid).filter(known);
    const pack = lastOrder ? packBySlug(lastOrder.pack) : null;
    if (!queue.length || !pack) {
      return emptyState({
        iconName: 'package-open',
        title: 'Rien à ouvrir pour le moment',
        text: 'Achète un pack pour lancer une ouverture. Tes cartes déjà révélées sont dans ta collection.',
        action: `<div class="empty__actions"><a class="btn btn--primary" href="#/packs">Voir les packs</a><a class="btn btn--secondary" href="#/collection">Ma collection</a></div>`,
      });
    }
    return sceneHtml(pack, queue.length);
  },

  mount(root) {
    const scene = root.querySelector('.opening');
    if (!scene) return null;

    const { pending, lastOrder } = getState();
    const queue = pending.map(ownedByUid).filter(known);
    const order = lastOrder;
    const pack = packBySlug(order.pack);
    // Toutes les cartes de la commande (y compris celles déjà révélées lors d'une visite précédente).
    const session = order.uids.map(ownedByUid).filter(known);
    const lockUntil = order.at + RULES.buybackLockMinutes * 60_000;

    let index = 0;
    let busy = false;
    let alive = true;
    let untilt = () => {};

    queue.forEach((o) => preload(cardById(o.cardId).imgHi));

    const $ = (sel) => scene.querySelector(sel);
    const setPhase = (phase) => {
      scene.dataset.phase = phase;
    };

    function paintProgress() {
      $('[data-progress]').textContent = queue.length > 1 ? `Carte ${index + 1} / ${queue.length}` : '';
    }

    function resultHtml(owned, card) {
      const last = index === queue.length - 1;
      const single = queue.length === 1;
      const locked = Date.now() < lockUntil;
      const next = single
        ? `<a class="btn btn--primary btn--lg" href="#/packs/${pack.slug}">${icon('package', { size: 18 })}Rouvrir un ${esc(pack.short)}</a>`
        : `<button class="btn btn--primary btn--lg" type="button" data-next>${last ? 'Voir le récapitulatif' : 'Carte suivante'}${icon('arrow-right', { size: 18 })}</button>`;
      return `
        ${rarityBadge(owned.rarity, 'badge--lg')}
        <h1 class="opening__name">${esc(card.name)}</h1>
        <p class="opening__meta">${esc(card.set)} · ${esc(cardRef(card))}</p>
        <p class="opening__value"><span data-value>${eur(0)}</span><small>cote indicative</small></p>
        <div class="opening__actions">
          <button class="btn btn--secondary btn--lg" type="button" data-sell-one>${icon('hand-coins', { size: 18 })}Revendre ${eur(buybackOf(owned))}</button>
          ${next}
        </div>
        ${locked ? `<p class="lock">${icon('timer', { size: 16 })}Prix de rachat garanti encore ${countdownInline(lockUntil, 'mmss', 'lock__time')}</p>` : ''}
        <p class="opening__kept">${icon('lock', { size: 14 })}Ta carte est déjà rangée dans ton coffre. ${single ? '<a href="#/collection">Voir ma collection</a>' : ''}</p>`;
    }

    async function open() {
      if (busy || scene.dataset.phase !== 'idle') return;
      busy = true;
      const owned = queue[index];
      const card = cardById(owned.cardId);
      const animated = motionOk();
      scene.dataset.rarity = '';
      scene.style.setProperty('--rc', `var(--r-${owned.rarity})`);
      $('[data-hint]').hidden = true;

      const front = $('[data-front]');
      front.innerHTML = '';
      const ready = preload(card.imgHi);

      if (animated) {
        sfx.charge();
        setPhase('charging');
        await wait(900);
        if (!alive) return;
        sfx.tear();
        setPhase('burst');
        $('[data-card]').hidden = false;
        await wait(650);
        if (!alive) return;
      } else {
        $('[data-card]').hidden = false;
      }

      await ready;
      if (!alive) return;
      front.innerHTML = `<img src="${card.imgHi}" alt="${esc(card.name)} — ${esc(card.set)}" width="734" height="1024" draggable="false">`;

      if (animated) {
        // Indice de rareté : le halo prend la couleur de la carte avant le retournement.
        scene.dataset.rarity = owned.rarity;
        setPhase('tease');
        await wait(RARITIES[owned.rarity].rank >= 3 ? 1100 : 600);
        if (!alive) return;
        sfx.flip();
        setPhase('flip');
        await wait(320);
        if (!alive) return;
      }

      scene.dataset.rarity = owned.rarity;
      setPhase('revealed');
      sfx.reveal(owned.rarity);
      if (BURST[owned.rarity]) {
        burst($('.opening__fx'), {
          color: getComputedStyle(scene).getPropertyValue('--rc').trim() || '#ffc83d',
          count: BURST[owned.rarity],
          power: 1 + RARITIES[owned.rarity].rank * 0.18,
        });
      }

      const result = $('[data-result]');
      result.innerHTML = resultHtml(owned, card);
      result.hidden = false;
      refreshCountdowns(result);
      countUp(result.querySelector('[data-value]'), owned.value, eur, 700 + RARITIES[owned.rarity].rank * 250);
      untilt();
      untilt = attachTilt($('[data-tilt]'), 14);
      markRevealed([owned.uid]);
      const skip = $('[data-skip]');
      if (skip && index >= queue.length - 1) skip.hidden = true;
      busy = false;
    }

    function resetScene() {
      untilt();
      untilt = () => {};
      $('[data-result]').hidden = true;
      $('[data-result]').innerHTML = '';
      $('[data-card]').hidden = true;
      scene.dataset.rarity = '';
      setPhase('idle');
      paintProgress();
    }

    function showSummary() {
      alive = false;
      untilt();
      markRevealed(queue.map((o) => o.uid));
      const shell = document.getElementById('shell');
      shell?.classList.remove('is-immersive');
      root.innerHTML = summaryHtml(session, pack, order, lockUntil);
      refreshCountdowns(root);
      window.scrollTo(0, 0);
    }

    function sell(uids) {
      const res = sellCards(uids);
      if (!res.ok) {
        toast(res.message, 'error');
        return null;
      }
      sfx.coins();
      toast(`${plural(res.count, 'carte revendue', 'cartes revendues')} : +${eur(res.total)} sur ton solde.`, 'success');
      return res;
    }

    function next() {
      if (index >= queue.length - 1) {
        showSummary();
        return;
      }
      index += 1;
      resetScene();
      // Les packs suivants s'ouvrent d'eux-mêmes : un seul geste par carte.
      setTimeout(() => alive && open(), 250);
    }

    const onClick = (e) => {
      if (e.target.closest('[data-sound]')) {
        setSetting('sound', !getState().settings.sound);
        const btn = root.querySelector('[data-sound]');
        if (btn) btn.innerHTML = soundIcon();
        return;
      }
      if (e.target.closest('[data-open]')) {
        open();
        return;
      }
      if (e.target.closest('[data-skip]')) {
        showSummary();
        return;
      }
      if (e.target.closest('[data-next]')) {
        if (!busy) next();
        return;
      }
      if (e.target.closest('[data-sell-one]')) {
        if (busy) return;
        const owned = queue[index];
        if (!sell([owned.uid])) return;
        if (queue.length === 1) {
          e.target.closest('[data-sell-one]').outerHTML = `<span class="btn btn--secondary btn--lg is-done" aria-disabled="true">${icon('check', { size: 18 })}Revendue ${eur(buybackOf(owned))}</span>`;
          root.querySelector('.lock')?.remove();
          const keptLine = root.querySelector('.opening__kept');
          if (keptLine) keptLine.innerHTML = `${icon('wallet', { size: 14 })}Le montant a été crédité sur ton solde.`;
        } else next();
        return;
      }
      const one = e.target.closest('[data-sell]');
      if (one) {
        if (sell([one.dataset.sell])) {
          root.innerHTML = summaryHtml(session, pack, order, lockUntil);
          refreshCountdowns(root);
        }
        return;
      }
      if (e.target.closest('[data-sell-all]')) {
        const uids = session.map((o) => ownedByUid(o.uid)).filter((o) => o && o.status === 'coffre').map((o) => o.uid);
        if (uids.length && sell(uids)) {
          root.innerHTML = summaryHtml(session, pack, order, lockUntil);
          refreshCountdowns(root);
        }
      }
    };

    root.addEventListener('click', onClick);
    paintProgress();

    return () => {
      alive = false;
      untilt();
      root.removeEventListener('click', onClick);
    };
  },
};
