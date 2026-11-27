// Ouverture des packs achetés : roulette carte par carte, puis récapitulatif.
//
// Les cartes sont déjà au coffre au moment où cette page s'affiche (le tirage
// a lieu à l'achat, par ticket vérifiable) : l'animation ne fait que révéler
// le résultat. Quitter la page en cours de route ne fait donc rien perdre.
//
// La bande de la roulette est HONNÊTE : les cartes qui défilent autour de la
// carte gagnée sont tirées avec les mêmes probabilités que le pack. Aucune
// « quasi-victoire » n'est fabriquée pour faire croire qu'un gros lot est
// passé près.

import { RULES } from '../config.js';
import { cardById, cardRef, packAvailable } from '../catalog.js';
import { RARITIES, packBySlug } from '../data/packs.js';
import { drawFromPack } from '../draw.js';
import { esc, eur, imgUrl, num, plural } from '../format.js';
import { icon } from '../icons.js';
import { intFrom, seeded } from '../rng.js';
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
const BURST = { peu_commune: 40, rare: 70, ultra_rare: 110, legendaire: 170, mythique: 240 };

/** Roulette : nombre de cartes sur la bande et position de la carte gagnée. */
const REEL_SIZE = 44;
const REEL_WIN = 38;
const REEL_START = 2;
const SPIN_MS = 5200;

const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

function sceneHtml(pack, total) {
  const fast = getState().settings.fast;
  return `
  <section class="opening" data-phase="idle" style="--glow:${themeGlow(pack.theme)}">
    <header class="opening__bar">
      <span class="opening__title"><strong>${esc(pack.name)}</strong><span data-progress></span></span>
      <span class="opening__tools">
        <button class="btn btn--icon btn--ghost" type="button" data-sound aria-label="Activer ou couper le son">${soundIcon()}</button>
        <button class="btn btn--secondary btn--sm" type="button" data-fast aria-pressed="${fast}" title="Passe la roulette et révèle la carte tout de suite">${icon('fast-forward', { size: 15 })}Rapide</button>
        ${total > 1 ? `<button class="btn btn--secondary btn--sm" type="button" data-skip>Tout révéler${icon('skip-forward', { size: 15 })}</button>` : ''}
      </span>
    </header>

    <div class="opening__stage">
      <span class="opening__aura" aria-hidden="true"></span>
      <span class="opening__rays" aria-hidden="true"></span>
      <canvas class="opening__fx" aria-hidden="true"></canvas>
      <button class="opening__pack" type="button" data-open aria-label="Ouvrir le pack">
        <span class="opening__pack-top">${packArt(pack, { lazy: false })}</span>
        <span class="opening__pack-body">${packArt(pack, { lazy: false })}</span>
      </button>
      <div class="reel" data-reel hidden>
        <div class="reel__band">
          <div class="reel__window"><div class="reel__strip" data-strip></div></div>
          <span class="reel__marker" aria-hidden="true"></span>
        </div>
      </div>
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
  const diff = totalValue - order.total;

  return `
  <section class="summary">
    <header class="page-head">
      <span class="page-head__ico">${icon(diff >= 0 ? 'party-popper' : 'package-open', { size: 24 })}</span>
      <div class="page-head__text">
        <h1>Ton ouverture</h1>
        <p class="page-head__lead">${plural(order.qty, 'pack', 'packs')} ${esc(pack.name)} · payé ${eur(order.total)}</p>
      </div>
    </header>

    <div class="stats">
      <div class="stat"><span class="stat__label">${icon('gem', { size: 16 })}Cote totale</span><strong class="stat__value">${eur(totalValue)}</strong><span class="stat__hint ${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : '−'}${eur(Math.abs(diff))} par rapport au prix payé</span></div>
      <div class="stat"><span class="stat__label">${icon('star', { size: 16 })}Meilleure carte</span><strong class="stat__value stat__value--text">${esc(best.card.name)}</strong><span class="stat__hint">${eur(best.owned.value)}</span></div>
      <div class="stat"><span class="stat__label">${icon('hand-coins', { size: 16 })}Rachat des cartes gardées</span><strong class="stat__value">${eur(keptBuyback)}</strong><span class="stat__hint">${Math.round((locked ? RULES.buybackRate : RULES.buybackLaterRate) * 100)} % de la cote</span></div>
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

    ${locked && kept.length ? `<p class="lock">${icon('timer', { size: 16 })}Rachat à ${Math.round(RULES.buybackRate * 100)} % garanti encore ${countdownInline(lockUntil, 'mmss', 'lock__time')}, puis ${Math.round(RULES.buybackLaterRate * 100)} %</p>` : ''}

    <div class="summary__actions">
      ${kept.length > 1 ? `<button class="btn btn--secondary" type="button" data-sell-all>${icon('hand-coins', { size: 18 })}Tout revendre — ${eur(keptBuyback)}</button>` : ''}
      <a class="btn btn--primary" href="#/collection">${icon('archive', { size: 18 })}Voir ma collection</a>
      <a class="btn btn--secondary" href="#/packs/${pack.slug}">${icon('package', { size: 18 })}Retour au ${esc(pack.short)}</a>
    </div>
    <p class="center small muted">${icon('shield-check', { size: 14 })} Chaque tirage est vérifiable : <a href="#/equite">voir mes tickets</a></p>
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
    let skipSpin = null;
    let raf = 0;
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
        ? `<a class="btn btn--primary btn--lg" href="#/collection">${icon('archive', { size: 18 })}Voir ma collection</a>`
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
        ${locked ? `<p class="lock">${icon('timer', { size: 16 })}Rachat à ${Math.round(RULES.buybackRate * 100)} % garanti encore ${countdownInline(lockUntil, 'mmss', 'lock__time')}, puis ${Math.round(RULES.buybackLaterRate * 100)} %</p>` : ''}
        <p class="opening__kept">${icon('shield-check', { size: 14 })}Ticket n° ${num(owned.roll?.ticket ?? 0)} · <a href="#/equite">vérifier ce tirage</a>${single ? ` · <a href="#/collection">voir ma collection</a>` : ''}</p>`;
    }

    /** Bande de la roulette : la carte gagnée à sa place, le reste tiré honnêtement. */
    function buildReel(owned, card) {
      const next = seeded(`reel:${owned.uid}`);
      const draw = intFrom(next);
      const tiles = Array.from({ length: REEL_SIZE }, (_, i) =>
        i === REEL_WIN ? { card, rarity: owned.rarity } : drawFromPack(pack, draw),
      );
      $('[data-strip]').innerHTML = tiles
        .map(
          (t, i) => `<span class="reel__tile" data-rarity="${t.rarity}" ${i === REEL_WIN ? 'data-win' : ''}>
            <img src="${esc(imgUrl(t.card.img))}" alt="" width="245" height="342" draggable="false">
          </span>`,
        )
        .join('');
      // Décalage d'arrêt à l'intérieur de la carte gagnée : purement visuel.
      return { tiles, jitter: (next() - 0.5) * 0.56 };
    }

    /** Fait défiler la bande jusqu'à la carte gagnée. Un clic termine l'animation. */
    function spin(jitter) {
      return new Promise((resolve) => {
        const strip = $('[data-strip]');
        const windowEl = strip.parentElement;
        const first = strip.children[0];
        const pitch = first.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(strip).columnGap || '0');
        const tileW = first.getBoundingClientRect().width;
        const center = windowEl.getBoundingClientRect().width / 2;
        const at = (i) => center - (i * pitch + tileW / 2);
        const from = at(REEL_START);
        const to = at(REEL_WIN) - jitter * tileW;
        const t0 = performance.now();
        let lastIndex = -1;
        let lastTick = 0;
        let done = false;

        const finish = () => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          skipSpin = null;
          strip.style.transform = `translate3d(${to}px, 0, 0)`;
          resolve();
        };
        skipSpin = finish;

        const frame = (now) => {
          if (!alive || done) return;
          const k = Math.min(1, (now - t0) / SPIN_MS);
          const x = from + (to - from) * easeOutQuart(k);
          strip.style.transform = `translate3d(${x}px, 0, 0)`;
          const under = Math.round((center - x - tileW / 2) / pitch);
          if (under !== lastIndex && now - lastTick > 40) {
            lastIndex = under;
            lastTick = now;
            sfx.tick();
          }
          if (k < 1) raf = requestAnimationFrame(frame);
          else finish();
        };
        strip.style.transform = `translate3d(${from}px, 0, 0)`;
        raf = requestAnimationFrame(frame);
      });
    }

    function reveal(owned, card) {
      scene.dataset.rarity = owned.rarity;
      setPhase('revealed');
      // On ne fête que ce qui vaut au moins le prix payé : une carte sous le prix n'est pas un gain.
      const won = owned.value >= pack.price;
      sfx.reveal(won ? owned.rarity : 'commune');
      if (won && BURST[owned.rarity]) {
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
      countUp(result.querySelector('[data-value]'), owned.value, eur, 700 + RARITIES[owned.rarity].rank * 220);
      untilt();
      untilt = attachTilt($('[data-tilt]'), 14);
      markRevealed([owned.uid]);
      const skip = $('[data-skip]');
      if (skip && index >= queue.length - 1) skip.hidden = true;
      busy = false;
    }

    async function open() {
      if (busy || scene.dataset.phase !== 'idle') return;
      busy = true;
      const owned = queue[index];
      const card = cardById(owned.cardId);
      const animated = motionOk();
      const fast = getState().settings.fast;
      scene.dataset.rarity = '';
      scene.style.setProperty('--rc', `var(--r-${owned.rarity})`);
      $('[data-hint]').hidden = true;

      const front = $('[data-front]');
      front.innerHTML = '';
      const ready = preload(card.imgHi);
      const showCard = () => {
        front.innerHTML = `<img src="${esc(imgUrl(card.imgHi))}" alt="${esc(card.name)} — ${esc(card.set)}" width="734" height="1024" draggable="false">`;
        $('[data-card]').hidden = false;
      };

      if (!animated) {
        await ready;
        if (!alive) return;
        showCard();
        reveal(owned, card);
        return;
      }

      // Pack passé en rupture avec cet achat : plus de table pour garnir la roulette, on révèle directement.
      if (fast || !packAvailable(pack)) {
        // Ouverture rapide : le pack se déchire, la carte se retourne.
        sfx.tear();
        setPhase('burst');
        $('[data-card]').hidden = false;
        await Promise.all([ready, wait(420)]);
        if (!alive) return;
        showCard();
        scene.dataset.rarity = owned.rarity;
        setPhase('tease');
        await wait(RARITIES[owned.rarity].rank >= 3 ? 700 : 320);
        if (!alive) return;
        sfx.flip();
        setPhase('flip');
        await wait(320);
        if (!alive) return;
        reveal(owned, card);
        return;
      }

      // Ouverture complète : le pack se charge, se déchire, puis la roulette tourne.
      const { tiles, jitter } = buildReel(owned, card);
      const thumbs = Promise.all(tiles.map((t) => preload(t.card.img, 1500)));
      sfx.charge();
      setPhase('charging');
      await Promise.all([wait(900), thumbs]);
      if (!alive) return;
      sfx.tear();
      setPhase('burst');
      await wait(380);
      if (!alive) return;
      $('[data-reel]').hidden = false;
      setPhase('spin');
      await spin(jitter);
      if (!alive) return;
      scene.dataset.rarity = owned.rarity;
      setPhase('landed');
      await Promise.all([ready, wait(750)]);
      if (!alive) return;
      $('[data-reel]').hidden = true;
      showCard();
      reveal(owned, card);
    }

    function resetScene() {
      untilt();
      untilt = () => {};
      $('[data-result]').hidden = true;
      $('[data-result]').innerHTML = '';
      $('[data-card]').hidden = true;
      $('[data-reel]').hidden = true;
      scene.dataset.rarity = '';
      setPhase('idle');
      paintProgress();
    }

    function showSummary() {
      alive = false;
      cancelAnimationFrame(raf);
      untilt();
      markRevealed(queue.map((o) => o.uid));
      document.getElementById('shell')?.classList.remove('is-immersive');
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
      const fastBtn = e.target.closest('[data-fast]');
      if (fastBtn) {
        const on = !getState().settings.fast;
        setSetting('fast', on);
        fastBtn.setAttribute('aria-pressed', String(on));
        if (on) skipSpin?.();
        return;
      }
      if (e.target.closest('[data-reel]')) {
        skipSpin?.();
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

    // Fin de la garantie de prix : les montants de rachat affichés passent au tarif différé.
    const onLockEnd = () => {
      if (root.querySelector('.summary')) {
        root.innerHTML = summaryHtml(session, pack, order, lockUntil);
        refreshCountdowns(root);
        return;
      }
      root.querySelector('.opening .lock')?.remove();
      const btn = root.querySelector('[data-sell-one]');
      if (btn) btn.innerHTML = `${icon('hand-coins', { size: 18 })}Revendre ${eur(buybackOf(queue[index]))}`;
    };

    root.addEventListener('click', onClick);
    root.addEventListener('countdown:end', onLockEnd);
    paintProgress();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      untilt();
      root.removeEventListener('click', onClick);
      root.removeEventListener('countdown:end', onLockEnd);
    };
  },
};
