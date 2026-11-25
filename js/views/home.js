// Accueil.

import { RULES } from '../config.js';
import { CARDS, cardById } from '../catalog.js';
import { recentOpenings } from '../data/community.js';
import { isActive, listGiveaways } from '../data/giveaways.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { esc, eur, eurShort } from '../format.js';
import { icon } from '../icons.js';
import { packTile, sectionHead } from '../ui/blocks.js';
import { cardImage, cardTile } from '../ui/card.js';
import { countdownBlocks } from '../ui/countdown.js';
import { attachTilt } from '../ui/effects.js';
import { packArt } from '../ui/pack-art.js';

/** Cartes mises en éventail dans le bandeau, avec repli sur les plus cotées. */
const HERO_IDS = ['swsh7-218', 'sv3pt5-199', 'sv4pt5-232'];

function heroCards() {
  const picked = HERO_IDS.map(cardById).filter(Boolean);
  for (const c of CARDS) {
    if (picked.length >= 3) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.slice(0, 3);
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
    icon: 'package',
    title: 'Choisis ton booster',
    text: `Cinq packs, de ${eur(PACKS[0].price)} à ${eur(Math.max(...PACKS.map((p) => p.price)))}. Les probabilités de chaque palier de cote sont affichées avant l'achat.`,
  },
  {
    icon: 'sparkles',
    title: 'Ouvre-le en ligne',
    text: 'Tu découvres ta carte tout de suite. Elle est rangée à ton nom dans notre coffre sécurisé.',
  },
  {
    icon: 'hand-coins',
    title: 'Garde, fais livrer ou revends',
    text: `Conserve-la au coffre, reçois-la chez toi (${RULES.shipping.fr.delay} en France), ou revends-la aussitôt à ${Math.round(RULES.buybackRate * 100)} % de sa cote.`,
  },
];

function giveawayBanner() {
  const g = listGiveaways().find((x) => isActive(x));
  if (!g) return '';
  const pack = g.pack ? packBySlug(g.pack) : null;
  return `<section class="gw-banner">
    <div class="gw-banner__copy">
      <span class="badge badge--hot">${icon('flame', { size: 13 })}En cours</span>
      <h2>${esc(g.title)}</h2>
      <p>${eurShort(g.total)} de lots · ${g.lots.length} gagnants${pack ? ` · 1 ${esc(pack.name)} = 1 ticket` : ''}</p>
      <div class="gw-banner__row">
        ${countdownBlocks(g.end, { seconds: false })}
        <a class="btn btn--primary" href="#/giveaways/${g.id}">Voir le giveaway${icon('arrow-right', { size: 16 })}</a>
      </div>
    </div>
    <div class="gw-banner__cards" aria-hidden="true">${g.lots.slice(0, 4).map((c) => cardImage(c)).join('')}</div>
  </section>`;
}

const DISCOVER = [
  { icon: 'circle-help', title: 'Foire aux questions', text: 'Paiement, coffre, livraison, rachat : les réponses aux questions qui reviennent le plus.', href: '#/faq', cta: 'Lire la FAQ' },
  { icon: 'scale', title: 'Transparence', text: 'Comment les cartes sont tirées, ce que valent les packs en moyenne et nos garde-fous.', href: '#/transparence', cta: 'Voir les chiffres' },
  { icon: 'message-circle', title: 'Une idée, un retour ?', text: 'Le projet est en construction : dis-nous ce qui te manque.', href: '#/contact', cta: 'Nous écrire' },
];

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
        <p class="lead">Chaque pack contient une carte authentique, gardée dans notre coffre. Tu la conserves, tu te la fais livrer ou tu la revends aussitôt à ${Math.round(RULES.buybackRate * 100)} % de sa cote.</p>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#/packs">Découvrir les packs${icon('arrow-right', { size: 18 })}</a>
          <a class="btn btn--secondary btn--lg" href="#/faq">Comment ça marche ?</a>
        </div>
        <ul class="hero__trust">
          <li>${icon('shield-check', { size: 17 })}Probabilités publiées</li>
          <li>${icon('package', { size: 17 })}1 pack = 1 vraie carte</li>
          <li>${icon('hand-coins', { size: 17 })}Rachat immédiat à ${Math.round(RULES.buybackRate * 100)} %</li>
        </ul>
      </div>
      <div class="hero__art" aria-hidden="true">
        <span class="hero__glow"></span>
        <span class="hero__card hero__card--l">${cardImage(b, { lazy: false })}</span>
        <span class="hero__card hero__card--r">${cardImage(c, { lazy: false })}</span>
        <span class="hero__card hero__card--c" data-tilt>${cardImage(a, { hi: true, lazy: false })}</span>
        <span class="hero__pack">${packArt(packBySlug('expert'))}</span>
      </div>
    </section>

    ${ticker()}

    <section class="section" id="comment">
      ${sectionHead('Comment ça marche ?')}
      <ol class="steps">
        ${STEPS.map(
          (s, i) => `<li class="step">
            <span class="step__num">${i + 1}</span>
            <span class="step__ico">${icon(s.icon, { size: 24 })}</span>
            <h3>${s.title}</h3>
            <p>${s.text}</p>
          </li>`,
        ).join('')}
      </ol>
    </section>

    <section class="section">
      ${sectionHead('Choisis ton booster', { link: `<a class="link-more" href="#/packs">Tous les packs${icon('arrow-right', { size: 15 })}</a>` })}
      <div class="pack-grid">${PACKS.map(packTile).join('')}</div>
    </section>

    <section class="section">
      ${sectionHead('Les plus grosses cartes du coffre', { iconName: 'star' })}
      <div class="tile-grid tile-grid--6">
        ${hits.map((card) => cardTile(card, { rarity: 'legendaire' })).join('')}
      </div>
      <p class="muted small">Cotes indicatives. Chaque carte ci-dessus peut sortir d'au moins un pack.</p>
    </section>

    ${giveawayBanner()}

    <section class="section">
      ${sectionHead('Découvrir')}
      <div class="grid-3">
        ${DISCOVER.map(
          (d) => `<article class="panel panel--pad info-card">
            <span class="info-card__ico">${icon(d.icon, { size: 22 })}</span>
            <h3>${d.title}</h3>
            <p>${d.text}</p>
            <a class="btn btn--secondary btn--block" href="${d.href}">${d.cta}${icon('arrow-right', { size: 15 })}</a>
          </article>`,
        ).join('')}
      </div>
    </section>`;
  },
  mount(root) {
    return attachTilt(root.querySelector('[data-tilt]'), 12);
  },
};
