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
import { packArt, packArtInfo, themeGlow } from '../ui/pack-art.js';

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

/** Nombre de lamelles du haut du sachet : chacune suit la déchirure et se recourbe. */
const SLICES = 24;
/** Part de la hauteur du sachet que couvre la bande du haut (un peu plus bas que la ligne de coupe). */
const STRIP = 13;
/** Hauteur de la ligne de coupe au point i (en % de la hauteur du sachet) : des dents de scie irrégulières. */
const jag = (i) => 10.6 + (i % 2 ? 1.3 : -1.3) + Math.sin(i * 2.7) * 0.5;

/** Découpe du corps du sachet, sous la ligne de coupe. */
function bodyClip() {
  const pts = [];
  for (let i = 0; i <= SLICES; i++) pts.push(`${((i / SLICES) * 100).toFixed(2)}% ${jag(i).toFixed(2)}%`);
  return `polygon(${pts.join(', ')}, 100% 100%, 0% 100%)`;
}

/** Haut du sachet en lamelles : chacune porte sa part de l'illustration et son bout de bord déchiré. */
function stripHtml(info) {
  let out = '';
  for (let i = 0; i < SLICES; i++) {
    const yl = ((jag(i) / STRIP) * 100).toFixed(1);
    const yr = ((jag(i + 1) / STRIP) * 100).toFixed(1);
    out += `<span class="opening__slice" style="clip-path:polygon(0 0, 100% 0, 100% ${yr}%, 0 ${yl}%)"><img src="${info.src}" alt="" draggable="false"><i class="opening__sheen"></i></span>`;
  }
  return out;
}

function sceneHtml(pack, total) {
  const fast = getState().settings.fast;
  const info = packArtInfo(pack);
  return `
  <section class="opening" data-phase="idle" style="--glow:${themeGlow(pack.theme)}">
    <h1 class="sr-only">Ouverture : ${esc(pack.name)}</h1>
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
      <span class="opening__ring" aria-hidden="true"></span>
      <canvas class="opening__fx" aria-hidden="true"></canvas>
      <canvas class="opening__sparks" aria-hidden="true"></canvas>
      <button class="opening__pack" type="button" data-open aria-label="Déchirer le pack pour l'ouvrir" style="--clip-body:${bodyClip()}">
        <span class="opening__pack-body">${packArt(pack, { lazy: false })}</span>
        ${
          info
            ? `<span class="opening__rig" aria-hidden="true" style="width:${info.width}%;aspect-ratio:${info.w}/${info.h}">
                <span class="opening__leak"></span>
                <span class="opening__slit"><span class="opening__slit-in"></span></span>
                <span class="opening__strip">${stripHtml(info)}</span>
                <span class="opening__tip"></span>
              </span>`
            : ''
        }
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
            <div class="flip__face flip__face--front"><span class="tcg" data-front></span><span class="holo" aria-hidden="true"></span><span class="flip__glare" aria-hidden="true"></span></div>
          </div>
        </div>
      </div>
      <span class="opening__flash" aria-hidden="true"></span>
    </div>

    <p class="opening__hint" data-hint>${icon('sparkles', { size: 16 })}Glisse sur le haut du pack pour le déchirer, ou touche-le</p>
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
                ? `<button class="btn btn--secondary btn--sm btn--block" type="button" data-sell="${esc(owned.uid)}">Revendre ${eur(buybackOf(owned))}</button>`
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
    let ripRaf = 0;
    let untilt = () => {};
    const packEl = scene.querySelector('[data-open]');

    const stage = scene.querySelector('.opening__stage');
    const rig = packEl.querySelector('.opening__rig');
    const slices = rig ? [...rig.querySelectorAll('.opening__slice')] : [];
    const sheens = slices.map((el) => el.lastElementChild);
    const slitEl = rig?.querySelector('.opening__slit');
    const slitIn = rig?.querySelector('.opening__slit-in');
    const leakEl = rig?.querySelector('.opening__leak');
    const tipEl = rig?.querySelector('.opening__tip');
    const sparkCanvas = scene.querySelector('.opening__sparks');
    /** Mesures en pixels de la bande : refaites quand la taille change. */
    const geo = { w: 0, h: 0, sh: 0, left: [], sw: [], ox: 0, oy: 0 };
    let ripping = false;
    let shown = 0;

    /** Place chaque lamelle au pixel près (pas de joint visible) et cale l'illustration dedans. */
    function layout() {
      if (!rig) return;
      const r = rig.getBoundingClientRect();
      const st = stage.getBoundingClientRect();
      geo.w = r.width;
      geo.h = r.height;
      geo.sh = Math.ceil((r.height * STRIP) / 100);
      geo.ox = r.left - st.left;
      geo.oy = r.top - st.top;
      slices.forEach((el, i) => {
        const left = Math.round((i * r.width) / SLICES);
        const right = Math.round(((i + 1) * r.width) / SLICES);
        geo.left[i] = left;
        geo.sw[i] = right - left;
        el.style.left = `${left}px`;
        el.style.width = `${right - left}px`;
        el.style.height = `${geo.sh}px`;
        const img = el.firstElementChild;
        img.style.width = `${r.width}px`;
        img.style.height = `${r.height}px`;
        img.style.left = `${-left}px`;
      });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      sparkCanvas.width = Math.round(st.width * dpr);
      sparkCanvas.height = Math.round(st.height * dpr);
      sparkCanvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* Étincelles de feuille d'aluminium qui s'échappent du point de déchirure. */
    const sparks = [];
    let sparkRaf = 0;
    let sparkLast = 0;
    function emitSparks(x, y, count) {
      for (let i = 0; i < count && sparks.length < 140; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const v = 60 + Math.random() * 220;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, ttl: 0.35 + Math.random() * 0.45, size: 1 + Math.random() * 2.2, gold: Math.random() < 0.6 });
      }
      if (!sparkRaf) {
        sparkLast = performance.now();
        sparkRaf = requestAnimationFrame(drawSparks);
      }
    }
    function drawSparks(now) {
      const g = sparkCanvas.getContext('2d');
      g.lineCap = 'round';
      const dt = Math.min(0.05, (now - sparkLast) / 1000);
      sparkLast = now;
      g.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += dt;
        if (s.life >= s.ttl) {
          sparks.splice(i, 1);
          continue;
        }
        s.vy += 620 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        g.globalAlpha = 1 - s.life / s.ttl;
        g.strokeStyle = s.gold ? '#ffd166' : '#ffffff';
        g.lineWidth = s.size;
        g.beginPath();
        g.moveTo(s.x, s.y);
        g.lineTo(s.x - s.vx * 0.028, s.y - s.vy * 0.028);
        g.stroke();
      }
      g.globalAlpha = 1;
      sparkRaf = sparks.length && alive ? requestAnimationFrame(drawSparks) : 0;
    }

    const ease = (t) => t * t * (3 - 2 * t);

    /**
     * Avancement de la déchirure (0 à 1). Le haut du sachet est une chaîne de lamelles : celles que
     * la déchirure a dépassées se soulèvent et se recourbent, chacune accrochée à la suivante, comme
     * une bande de feuille qu'on pèle. Seules des transformations et des opacités changent : rien
     * n'est repeint, l'animation reste fluide même sur mobile.
     */
    const setRip = (p) => {
      const grew = p > shown;
      shown = p;
      if (!rig) return;
      if (!geo.w) layout();
      const front = p * geo.w * 1.06;
      const reach = geo.w * 0.5;
      // On remonte la chaîne de droite à gauche : chaque lamelle part du bord gauche de la précédente.
      let ax = geo.w;
      let ay = geo.sh;
      for (let i = SLICES - 1; i >= 0; i--) {
        const w = geo.sw[i];
        const center = geo.left[i] + w / 2;
        const t = Math.max(0, Math.min(1, (front - center) / reach));
        if (t <= 0) {
          slices[i].style.transform = '';
          sheens[i].style.opacity = '';
          ax = geo.left[i];
          ay = geo.sh;
          continue;
        }
        const angle = 1.35 * ease(t);
        const dx = ax - (geo.left[i] + w);
        const dy = ay - geo.sh;
        slices[i].style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
        // Le reflet de la feuille grandit avec la courbure : la bande prend du volume.
        sheens[i].style.opacity = (0.7 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.25 * t).toFixed(3);
        ax -= w * Math.cos(angle);
        ay -= w * Math.sin(angle);
      }
      const tipX = Math.min(geo.w, front);
      const tipY = (geo.h * jag(Math.round((tipX / geo.w) * SLICES))) / 100;
      slitIn.style.transform = `translateX(${((Math.min(1, p * 1.06) - 1) * 100).toFixed(2)}%)`;
      slitEl.style.opacity = Math.min(1, p * 4).toFixed(3);
      leakEl.style.transform = `scale(${Math.min(1, p * 1.06).toFixed(3)}, ${(0.35 + 0.65 * p).toFixed(3)})`;
      leakEl.style.opacity = Math.min(0.9, p * 2.2).toFixed(3);
      tipEl.style.transform = `translate3d(${tipX.toFixed(1)}px, ${tipY.toFixed(1)}px, 0)`;
      tipEl.style.opacity = Math.max(0, Math.min(1, p * 30, (1 - p) * 12)).toFixed(3);
      if (grew && p > 0.02 && p < 1) emitSparks(geo.ox + tipX, geo.oy + tipY, 2);
      if (p > 0.01 !== ripping) {
        ripping = !ripping;
        packEl.classList.toggle('is-ripping', ripping);
      }
    };
    /** Après la déchirure : les feuilles de style reprennent la main (envol de la bande, fondu de la lumière). */
    const releaseRip = () => {
      if (!rig) return;
      slitEl.style.opacity = '';
      leakEl.style.opacity = '';
      tipEl.style.opacity = '';
      emitSparks(geo.ox + geo.w / 2, geo.oy + (geo.h * 10.6) / 100, 46);
    };
    const buzz = (pattern) => {
      try {
        navigator.vibrate?.(pattern);
      } catch {
        // Pas de vibreur : rien à faire.
      }
    };
    const animateRip = (from, to, ms) =>
      new Promise((resolve) => {
        cancelAnimationFrame(ripRaf);
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          setRip(from + (to - from) * (1 - (1 - k) ** 3));
          if (k < 1 && alive) ripRaf = requestAnimationFrame(step);
          else resolve();
        };
        ripRaf = requestAnimationFrame(step);
      });

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
          (t, i) => `<span class="reel__tile" data-rarity="${esc(t.rarity)}" ${i === REEL_WIN ? 'data-win' : ''}>
            <img src="${esc(imgUrl(t.card.img))}" alt="" width="245" height="342" draggable="false">
          </span>`,
        )
        .join('');
      // Décalage d'arrêt à l'intérieur de la carte gagnée : purement visuel.
      return { tiles, jitter: (next() - 0.5) * 0.56 };
    }

    /**
     * Prépare la roulette de la carte en cours dès que le pack s'affiche : ses images se chargent
     * pendant que le joueur regarde le pack, pas après la déchirure.
     */
    let prepared = null;
    function prepareReel() {
      const owned = queue[index];
      if (!owned || prepared?.index === index) return prepared;
      const reel = buildReel(owned, cardById(owned.cardId));
      prepared = { index, ...reel, thumbs: Promise.all(reel.tiles.map((t) => preload(t.card.img, 1500))) };
      return prepared;
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
        const marker = windowEl.parentElement.querySelector('.reel__marker');
        const tilesEl = strip.children;
        /** Cartes grossies en ce moment : celle sous le repère enfle en passant, comme sous une loupe. */
        const lit = new Set();
        const focus = (x) => {
          const pos = (center - x - tileW / 2) / pitch;
          const lo = Math.max(0, Math.floor(pos) - 1);
          const hi = Math.min(tilesEl.length - 1, Math.ceil(pos) + 1);
          for (const i of lit) {
            if (i < lo || i > hi) {
              tilesEl[i].style.transform = '';
              lit.delete(i);
            }
          }
          for (let i = lo; i <= hi; i++) {
            const d = Math.abs(i - pos);
            tilesEl[i].style.transform = d < 1 ? `scale(${(1 + 0.1 * (1 - d)).toFixed(3)})` : '';
            lit.add(i);
          }
        };

        const finish = () => {
          if (done) return;
          done = true;
          cancelAnimationFrame(raf);
          skipSpin = null;
          for (const i of lit) tilesEl[i].style.transform = '';
          lit.clear();
          strip.style.transform = `translate3d(${to}px, 0, 0)`;
          resolve();
        };
        skipSpin = finish;

        const frame = (now) => {
          if (!alive || done) return;
          const k = Math.min(1, (now - t0) / SPIN_MS);
          const x = from + (to - from) * easeOutQuart(k);
          strip.style.transform = `translate3d(${x}px, 0, 0)`;
          focus(x);
          const under = Math.round((center - x - tileW / 2) / pitch);
          if (under !== lastIndex && now - lastTick > 40) {
            lastIndex = under;
            lastTick = now;
            sfx.tick(k);
            // Le repère tressaille à chaque carte qui passe.
            marker?.animate?.([{ transform: 'scaleY(1.1)' }, { transform: 'scaleY(1)' }], { duration: 120, easing: 'ease-out' });
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
      scene.dataset.won = won ? '1' : '';
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

    async function open({ ripped = false } = {}) {
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
        if (RARITIES[owned.rarity].rank >= 3) sfx.suspense(RARITIES[owned.rarity].rank);
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
      const { jitter, thumbs } = prepareReel();
      // Le sachet se déchire (à la main, ou tout seul après un toucher), puis la lumière jaillit.
      setPhase('ripping');
      if (!ripped) {
        layout();
        sfx.rip(0.7);
        await animateRip(0, 1, 700);
      }
      await Promise.race([thumbs, wait(200)]);
      if (!alive) return;
      sfx.burst();
      setPhase('burst');
      releaseRip();
      buzz([14, 30, 38]);
      await wait(380);
      if (!alive) return;
      $('[data-reel]').hidden = false;
      setPhase('spin');
      await spin(jitter);
      if (!alive) return;
      scene.dataset.rarity = owned.rarity;
      setPhase('landed');
      sfx.land();
      const rank = RARITIES[owned.rarity].rank;
      if (rank >= 3) sfx.suspense(rank);
      await Promise.all([ready, wait(rank >= 4 ? 1150 : rank >= 3 ? 850 : 750)]);
      if (!alive) return;
      // La carte gagnée quitte la roulette et vient se poser au centre, au lieu d'apparaître d'un coup.
      const winRect = $('[data-strip] [data-win]')?.getBoundingClientRect();
      $('[data-reel]').hidden = true;
      showCard();
      reveal(owned, card);
      flyFrom(winRect);
    }

    /** Fait partir la carte de l'endroit et de la taille qu'elle avait dans la roulette. */
    function flyFrom(rect) {
      const el = $('[data-card]');
      if (!rect || !rect.width || !el.animate || !motionOk()) return;
      el.style.animation = 'none';
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const dx = rect.left + rect.width / 2 - (r.left + r.width / 2);
      const dy = rect.top + rect.height / 2 - (r.top + r.height / 2);
      el.animate(
        [
          { transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${(rect.width / r.width).toFixed(3)})` },
          { transform: 'translate(0, -3%) scale(1.07)', offset: 0.72 },
          { transform: 'none' },
        ],
        { duration: 640, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    }

    function resetScene() {
      cancelAnimationFrame(ripRaf);
      setRip(0);
      untilt();
      untilt = () => {};
      $('[data-result]').hidden = true;
      $('[data-result]').innerHTML = '';
      $('[data-card]').hidden = true;
      $('[data-card]').style.animation = '';
      $('[data-reel]').hidden = true;
      scene.dataset.rarity = '';
      scene.dataset.won = '';
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
      prepareReel();
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
        if (!suppressClick) open();
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

    // Geste de déchirure : on glisse de gauche à droite le long du haut du pack.
    let drag = null;
    let suppressClick = false;
    let followRaf = 0;
    /** Rapproche l'affichage de la position du doigt à chaque image : le geste reste souple même si les événements arrivent par à-coups. */
    const follow = () => {
      if (!drag) return;
      const next = shown + (drag.p - shown) * 0.38;
      setRip(Math.abs(drag.p - next) < 0.002 ? drag.p : next);
      followRaf = requestAnimationFrame(follow);
    };
    const finishDrag = async (force) => {
      const d = drag;
      if (!d) return;
      drag = null;
      cancelAnimationFrame(followRaf);
      d.live?.stop();
      if (!d.moved) return; // simple toucher : le clic fera le reste
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 80);
      if (d.p >= 0.6 || force) {
        await animateRip(shown, 1, 160);
        open({ ripped: true });
      } else await animateRip(shown, 0, 280);
    };
    const onDown = (e) => {
      if (busy || scene.dataset.phase !== 'idle' || !motionOk() || getState().settings.fast) return;
      layout();
      drag = { x: e.clientX, w: geo.w || packEl.offsetWidth, p: 0, step: 0, last: e.clientX, t: performance.now(), moved: false, live: null };
      packEl.setPointerCapture?.(e.pointerId);
      sfx.grab();
    };
    const onMove = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && dx < 10) return;
      if (!drag.moved) {
        drag.moved = true;
        drag.live = sfx.ripLive();
        followRaf = requestAnimationFrame(follow);
      }
      drag.p = Math.max(0, Math.min(1, dx / (drag.w * 0.92)));
      const now = performance.now();
      drag.live.set((Math.abs(e.clientX - drag.last) / Math.max(1, now - drag.t)) / 1.6, drag.p);
      drag.last = e.clientX;
      drag.t = now;
      // Un petit cran sous le doigt tous les huitièmes de la déchirure.
      if (Math.floor(drag.p * 8) > drag.step) {
        drag.step = Math.floor(drag.p * 8);
        buzz(5);
        drag.live.notch();
      }
      if (drag.p >= 1) finishDrag(true);
    };
    const onUp = () => finishDrag(false);
    const onResize = () => {
      geo.w = 0;
      if (scene.dataset.phase === 'idle') {
        layout();
        setRip(0);
      }
    };
    window.addEventListener('resize', onResize);
    packEl.addEventListener('pointerdown', onDown);
    packEl.addEventListener('pointermove', onMove);
    packEl.addEventListener('pointerup', onUp);
    packEl.addEventListener('pointercancel', onUp);

    root.addEventListener('click', onClick);
    root.addEventListener('countdown:end', onLockEnd);
    paintProgress();
    if (motionOk() && !getState().settings.fast) prepareReel();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ripRaf);
      cancelAnimationFrame(followRaf);
      cancelAnimationFrame(sparkRaf);
      window.removeEventListener('resize', onResize);
      drag?.live?.stop();
      untilt();
      root.removeEventListener('click', onClick);
      root.removeEventListener('countdown:end', onLockEnd);
    };
  },
};
