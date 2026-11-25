// Accueil.

import { RULES } from '../config.js';
import { CARDS } from '../catalog.js';
import { BADGES } from '../data/badges.js';
import { giveawayTickets, recentOpenings } from '../data/community.js';
import { giveawayPool, isActive, listGiveaways } from '../data/giveaways.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { esc, eur, eurShort, num, pct } from '../format.js';
import { icon } from '../icons.js';
import { evolutionChance } from '../store.js';
import { currentTheme, signatureCard } from '../theme.js';
import { packTile, sectionHead } from '../ui/blocks.js';
import { cardImage, cardTile } from '../ui/card.js';
import { countdownBlocks } from '../ui/countdown.js';
import { attachTilt } from '../ui/effects.js';
import { packArt } from '../ui/pack-art.js';

const rate = Math.round(RULES.buybackRate * 100);

/**
 * Cartes mises en éventail dans le bandeau : celle qui illustre le thème choisi
 * au centre, entourée de deux autres cartes du même univers.
 */
function heroCards() {
  const theme = currentTheme();
  const center = signatureCard(theme);
  const { types, names } = theme.match;
  const kin = (c) => c.id !== center.id && c.nameEn !== center.nameEn && (types ? types.includes(c.type) : names.test(c.nameEn));
  const sides = [];
  for (const c of CARDS) {
    if (sides.length >= 2) break;
    if (kin(c) && !sides.some((s) => s.nameEn === c.nameEn)) sides.push(c);
  }
  for (const c of CARDS) {
    if (sides.length >= 2) break;
    if (c.id !== center.id && !sides.includes(c)) sides.push(c);
  }
  return [center, ...sides];
}

function ticker() {
  const pulls = recentOpenings(null, 14);
  if (!pulls.length) return '';
  const items = pulls
    .map(
      (p) => `<span class="ticker__item" data-rarity="${p.rarity}">
        <span class="ticker__img">${cardImage(p.card)}</span>
        <span class="ticker__txt"><b>${esc(p.card.name)}</b><small>${esc(p.pseudo)} · ${eur(p.card.value)}</small></span>
      </span>`,
    )
    .join('');
  return `<section class="ticker" aria-label="Dernières ouvertures (simulées)">
    <span class="ticker__label">${icon('radio', { size: 14 })}Ouvertures<small>simulées</small></span>
    <div class="ticker__viewport"><div class="ticker__track">${items}${items}</div></div>
  </section>`;
}

const STEPS = [
  {
    title: 'Choisis ton booster',
    text: `${PACKS.length} packs, de ${eur(Math.min(...PACKS.map((p) => p.price)))} à ${eur(Math.max(...PACKS.map((p) => p.price)))}. La probabilité de chaque carte est publiée avant l'achat.`,
  },
  {
    title: 'Ouvre-le en ligne',
    text: 'La roulette tourne, ta carte sort. Elle est rangée à ton nom dans notre coffre, et son tirage est vérifiable.',
  },
  {
    title: 'Garde, fais livrer ou revends',
    text: `Au coffre, chez toi (${RULES.shipping.fr.delay} en France), ou revendue à ${rate} % de sa cote dans les ${RULES.buybackLockMinutes} minutes.`,
  },
];

function giveawayBanner() {
  const g = listGiveaways().find((x) => isActive(x));
  if (!g) return '';
  const pack = g.pack ? packBySlug(g.pack) : null;
  const pool = giveawayPool(g, giveawayTickets(g));
  return `<section class="gw-banner">
    <div class="gw-banner__copy">
      <span class="badge badge--hot">${icon('flame', { size: 13 })}En cours</span>
      <h2>${esc(g.title)}</h2>
      <p>${pool.funded ? `${eurShort(pool.pool)} de lots déjà débloqués sur ${eurShort(g.total)}` : `${eurShort(g.total)} de lots`}${pack ? ` · 1 ${esc(pack.name)} = 1 ticket` : ''}</p>
      <div class="gw-banner__row">
        ${countdownBlocks(g.end, { seconds: false })}
        <a class="btn btn--primary" href="#/giveaways/${g.id}">Voir le giveaway${icon('arrow-right', { size: 16 })}</a>
      </div>
    </div>
    <div class="gw-banner__cards" aria-hidden="true">${g.lots.slice(0, 4).map((c) => cardImage(c)).join('')}</div>
  </section>`;
}

/**
 * Exemple d'Évolution pour l'accueil : deux cartes du catalogue, l'une valant
 * à peu près le double de l'autre, et la chance réelle que donne la règle.
 */
function evolutionExample() {
  const stake = [...CARDS].reverse().find((c) => c.value >= 18_00) || CARDS[CARDS.length - 1];
  const target = [...CARDS].reverse().find((c) => c.value >= stake.value * 2 && c.nameEn !== stake.nameEn) || CARDS[0];
  return { stake, target, chance: evolutionChance(stake.value, target.value) };
}

/** Anneau de la jauge : part colorée = chance de réussite. */
function ring(chance) {
  const r = 42;
  const len = 2 * Math.PI * r;
  return `<span class="bento__gauge">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="${r}" class="bento__gauge-track"></circle>
      <circle cx="50" cy="50" r="${r}" class="bento__gauge-fill" stroke-dasharray="${(len * chance).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 50 50)"></circle>
    </svg>
    <strong>${pct(chance * 100)}</strong>
  </span>`;
}

function extras() {
  const { stake, target, chance } = evolutionExample();
  const first = BADGES[0];
  const last = BADGES[BADGES.length - 1];
  return `<div class="bento">
    <article class="bento__cell bento__cell--wide">
      <p class="eyebrow">${icon('chevrons-up', { size: 15 })}Évolution</p>
      <h3>Mise une carte, vise plus haut</h3>
      <p class="muted">Choisis une carte de ton coffre et celle que tu vises : la jauge affiche ta chance exacte avant que tu joues.</p>
      <div class="bento__evo" aria-hidden="true">
        <span class="bento__evo-card">${cardImage(stake)}<small>${eur(stake.value)}</small></span>
        ${ring(chance)}
        <span class="bento__evo-card bento__evo-card--target">${cardImage(target)}<small>${eur(target.value)}</small></span>
      </div>
      <a class="link-more" href="#/evolution">Tenter une évolution${icon('arrow-right', { size: 15 })}</a>
    </article>

    <article class="bento__cell">
      <p class="eyebrow">${icon('shield-check', { size: 15 })}Équité prouvable</p>
      <h3>Chaque tirage se recalcule</h3>
      <dl class="receipt" aria-label="Exemple de tirage">
        <div><dt>Ticket</dt><dd>${num(695_677)} <span>/ ${num(1_000_000)}</span></dd></div>
        <div><dt>Plage de la carte</dt><dd>${num(690_112)} – ${num(701_480)}</dd></div>
        <div><dt>Vérification</dt><dd class="pos">${icon('check', { size: 14 })}Conforme</dd></div>
      </dl>
      <a class="link-more" href="#/equite">Voir comment${icon('arrow-right', { size: 15 })}</a>
    </article>

    <article class="bento__cell">
      <p class="eyebrow">${icon('hand-coins', { size: 15 })}Cashback</p>
      <h3>Une part de la marge te revient</h3>
      <div class="bento__badges" aria-hidden="true">
        ${BADGES.map((b) => `<span data-theme="${b.theme}">${icon(b.icon, { size: 16 })}</span>`).join('')}
      </div>
      <p class="muted small">De ${pct(first.cashback * 100)} à ${pct(last.cashback * 100)} de la marge du site sur tes mises : neuf badges la font grossir.</p>
      <a class="link-more" href="#/recompenses">Voir le cashback${icon('arrow-right', { size: 15 })}</a>
    </article>
  </div>`;
}

export default {
  nav: 'home',
  title: '',
  render() {
    const [a, b, c] = heroCards();
    const hits = CARDS.slice(0, 6);
    return `
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">${icon('sparkles', { size: 15 })}Packs mystère · vraies cartes</p>
        <h1>Ouvre en ligne.<br><em>Reçois en vrai.</em></h1>
        <p class="lead">Chaque pack contient une carte authentique, gardée dans notre coffre. Tu la conserves, tu te la fais livrer ou tu la revends aussitôt à ${rate} % de sa cote.</p>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#/packs">Découvrir les packs${icon('arrow-right', { size: 18 })}</a>
          <a class="btn btn--secondary btn--lg" href="#/equite">Tirages vérifiables</a>
        </div>
        <ul class="hero__trust">
          <li>${icon('shield-check', { size: 17 })}Équité prouvable</li>
          <li>${icon('percent', { size: 17 })}Retour théorique affiché sur chaque pack</li>
          <li>${icon('hand-coins', { size: 17 })}Rachat immédiat à ${rate} %</li>
        </ul>
      </div>
      <div class="hero__art" aria-hidden="true">
        <span class="hero__glow"></span>
        <span class="hero__card hero__card--l">${cardImage(b, { lazy: false })}</span>
        <span class="hero__card hero__card--r">${cardImage(c, { lazy: false })}</span>
        <span class="hero__card hero__card--c" data-tilt>${cardImage(a, { hi: true, lazy: false })}</span>
        <span class="hero__pack">${packArt(packBySlug('legende'))}</span>
      </div>
    </section>

    ${ticker()}

    <section class="section">
      ${sectionHead('Choisis ton booster', { link: `<a class="link-more" href="#/packs">Tous les packs${icon('arrow-right', { size: 15 })}</a>` })}
      <div class="pack-grid">${PACKS.map(packTile).join('')}</div>
    </section>

    <section class="section" id="comment">
      ${sectionHead('Comment ça marche ?')}
      <ol class="steps">
        ${STEPS.map(
          (s, i) => `<li class="step">
            <span class="step__num">${i + 1}</span>
            <div><h3>${s.title}</h3><p>${s.text}</p></div>
          </li>`,
        ).join('')}
      </ol>
    </section>

    <section class="section">
      ${sectionHead('Plus que des packs')}
      ${extras()}
    </section>

    <section class="section">
      ${sectionHead('Les plus grosses cartes du coffre', { iconName: 'star' })}
      <div class="tile-grid tile-grid--6">
        ${hits.map((card) => cardTile(card, { rarity: 'mythique' })).join('')}
      </div>
      <p class="muted small">Cotes indicatives. Chaque carte ci-dessus peut sortir d'au moins un pack ; sa probabilité exacte est sur la page du pack.</p>
    </section>

    ${giveawayBanner()}

    <p class="center muted">Une question ? <a href="#/faq">Lis la FAQ</a> ou regarde <a href="#/transparence">ce que vaut un pack en moyenne</a>.</p>`;
  },
  mount(root) {
    return attachTilt(root.querySelector('[data-tilt]'), 12);
  },
};
