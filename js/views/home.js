// Accueil : le lobby. Les packs, les jeux, le coffre et les ouvertures en direct.

import { RULES } from '../config.js';
import { CARDS, packAvailable, packReturn, profitChance, stockCards } from '../catalog.js';
import { giveawayTickets, recentOpenings } from '../data/community.js';
import { giveawayPool, isActive, listGiveaways } from '../data/giveaways.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { ago, esc, eur, eurShort, initials, num, pct } from '../format.js';
import { icon } from '../icons.js';
import { qtyOf } from '../stock.js';
import { evolutionChance, getState, isLoggedIn } from '../store.js';
import { currentTheme, signatureCard } from '../theme.js';
import { packTile, sectionHead } from '../ui/blocks.js';
import { cardImage, cardTile, rarityBadge } from '../ui/card.js';
import { countdownInline } from '../ui/countdown.js';
import { attachTilt } from '../ui/effects.js';
import { packArt } from '../ui/pack-art.js';

const rate = Math.round(RULES.buybackRate * 100);

/** Onglet du tableau des ouvertures, gardé tant qu'on reste sur le site. */
const ui = { feed: 'all' };

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

/** Anneau de jauge : part colorée = chance de réussite. */
function ring(chance) {
  const r = 42;
  const len = 2 * Math.PI * r;
  return `<span class="gauge-mini">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="${r}" class="gauge-mini__track"></circle>
      <circle cx="50" cy="50" r="${r}" class="gauge-mini__fill" stroke-dasharray="${(len * chance).toFixed(1)} ${len.toFixed(1)}" transform="rotate(-90 50 50)"></circle>
    </svg>
    <strong>${pct(chance * 100)}</strong>
  </span>`;
}

/** Les trois jeux à côté des packs : Évolution, viser une carte, giveaway en cours. */
function games() {
  const pool = stockCards().length >= 2 ? stockCards() : CARDS;
  const stake = [...pool].reverse().find((c) => c.value >= 18_00) || pool[pool.length - 1];
  const target = [...pool].reverse().find((c) => c.value >= stake.value * 2 && c.nameEn !== stake.nameEn) || pool[0];
  const wanted = pool.slice(0, 3);
  const g = listGiveaways().find((x) => isActive(x) && x.lots.length);
  const gPool = g ? giveawayPool(g, giveawayTickets(g)) : null;
  return `<div class="games">
    <a class="game" href="#/evolution">
      <span class="game__art game__art--evo" aria-hidden="true">
        <span class="game__card">${cardImage(stake)}</span>
        ${ring(evolutionChance(stake.value, target.value))}
        <span class="game__card game__card--big">${cardImage(target)}</span>
      </span>
      <span class="game__body"><strong>Évolution</strong><small>Mise une carte, vise plus haut</small></span>
      ${icon('arrow-right', { size: 18 })}
    </a>
    <a class="game" href="#/cartes">
      <span class="game__art game__art--fan" aria-hidden="true">${wanted.map((c) => cardImage(c)).join('')}</span>
      <span class="game__body"><strong>Vise une carte</strong><small>Trouve le pack d'où elle sort, et à quelle chance</small></span>
      ${icon('arrow-right', { size: 18 })}
    </a>
    ${
      g
        ? `<a class="game" href="#/giveaways/${g.id}">
            <span class="game__art game__art--fan" aria-hidden="true">${g.lots.slice(0, 3).map((c) => cardImage(c)).join('')}</span>
            <span class="game__body"><strong>${esc(g.title)}</strong><small>${gPool.funded ? `${eurShort(gPool.pool)} de lots débloqués` : `${eurShort(g.total)} de lots`} · fin dans ${countdownInline(g.end, 'long')}</small></span>
            ${icon('arrow-right', { size: 18 })}
          </a>`
        : `<a class="game" href="#/recompenses">
            <span class="game__art game__art--fan" aria-hidden="true">${pool.slice(3, 6).map((c) => cardImage(c)).join('')}</span>
            <span class="game__body"><strong>Cashback</strong><small>Une part de la marge te revient</small></span>
            ${icon('arrow-right', { size: 18 })}
          </a>`
    }
  </div>`;
}

/** Lignes du tableau des ouvertures selon l'onglet. */
function feedRows() {
  if (ui.feed === 'mine') {
    return getState()
      .cards.filter((c) => packBySlug(c.pack))
      .sort((a, b) => b.at - a.at)
      .slice(0, 12)
      .map((c) => ({ at: c.at, pseudo: getState().user.pseudo, pack: packBySlug(c.pack), card: CARDS.find((x) => x.id === c.cardId) || stockCards().find((x) => x.id === c.cardId), value: c.value, rarity: c.rarity }))
      .filter((r) => r.card);
  }
  const rows = recentOpenings(null, ui.feed === 'big' ? 80 : 12).map((r) => ({ ...r, value: r.card.value }));
  return ui.feed === 'big' ? rows.filter((r) => r.value >= r.pack.price * 2).slice(0, 12) : rows;
}

function feed() {
  const rows = feedRows();
  const tab = (key, label) => `<button class="tab ${ui.feed === key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.feed === key}" data-feed="${key}">${label}</button>`;
  return `
    <div class="section__head">
      <h2>${icon('radio', { size: 20 })}<span>En direct</span></h2>
      ${ui.feed === 'mine' ? '' : `<span class="simulated" title="Contenu généré pour la démonstration">${icon('info', { size: 13 })}Simulé</span>`}
      <div class="tabs" role="tablist" aria-label="Ouvertures">${tab('all', 'Tout')}${tab('big', 'Gros lots')}${isLoggedIn() ? tab('mine', 'Les miennes') : ''}</div>
    </div>
    ${
      rows.length
        ? `<div class="table-wrap"><table class="table table--feed">
            <thead><tr><th>Joueur</th><th>Pack</th><th>Carte</th><th class="num">Cote</th><th class="num">Gain</th><th class="num">Quand</th></tr></thead>
            <tbody>${rows
              .map(({ at, pseudo, pack, card, value, rarity }) => {
                const mult = value / pack.price;
                return `<tr>
                  <td><span class="feed__who"><span class="avatar avatar--sm" aria-hidden="true">${esc(initials(pseudo))}</span>${esc(pseudo)}</span></td>
                  <td><a href="#/packs/${pack.slug}">${esc(pack.short)}</a></td>
                  <td><span class="drop"><span class="drop__img">${cardImage(card)}</span><span><strong>${esc(card.name)}</strong>${rarityBadge(rarity)}</span></span></td>
                  <td class="num">${eur(value)}</td>
                  <td class="num"><span class="mult ${mult >= 1 ? 'is-up' : ''}">×${mult.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></td>
                  <td class="num muted nowrap">${ago(at)}</td>
                </tr>`;
              })
              .join('')}</tbody>
          </table></div>`
        : `<p class="muted">${ui.feed === 'mine' ? "Tu n'as encore rien ouvert." : 'Aucune ouverture pour le moment.'}</p>`
    }`;
}

export default {
  nav: 'home',
  title: '',
  render() {
    const [a, b, c] = heroCards();
    const vault = stockCards();
    const open = PACKS.filter(packAvailable);
    const returns = open.map(packReturn);
    const below = open.map((p) => 1 - profitChance(p));
    const top = vault.slice(0, 6);
    return `
    <section class="hero">
      <div class="hero__copy">
        <p class="eyebrow">${icon('sparkles', { size: 15 })}Packs mystère · vraies cartes</p>
        <h1>Ouvre en ligne.<br><em>Reçois en vrai.</em></h1>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#/packs">Ouvrir un pack${icon('arrow-right', { size: 18 })}</a>
          <a class="btn btn--secondary btn--lg" href="#/cartes">Voir le coffre</a>
        </div>
        <ul class="hero__chips">
          ${returns.length ? `<li><strong>${pct(Math.min(...returns) * 100)} – ${pct(Math.max(...returns) * 100)}</strong>retour moyen</li>
          <li><strong>${pct(Math.min(...below) * 100)} – ${pct(Math.max(...below) * 100)}</strong>des tirages sous le prix</li>` : ''}
          <li><strong>${num(vault.length)}</strong>cartes au coffre</li>
          <li><strong>${rate} %</strong>de la cote au rachat</li>
          <li><a href="#/equite"><strong>${icon('shield-check', { size: 16 })}</strong>tirage vérifiable</a></li>
        </ul>
      </div>
      <div class="hero__art" aria-hidden="true">
        <span class="hero__glow"></span>
        <span class="hero__card hero__card--l">${cardImage(b, { lazy: false })}</span>
        <span class="hero__card hero__card--r">${cardImage(c, { lazy: false })}</span>
        <span class="hero__card hero__card--c" data-tilt>${cardImage(a, { hi: true, lazy: false })}</span>
        <span class="hero__pack">${packArt(packBySlug('legende'), { lazy: false })}</span>
      </div>
    </section>

    <section class="section">
      ${sectionHead('Packs', { iconName: 'package' })}
      <div class="pack-grid">${PACKS.map(packTile).join('')}</div>
    </section>

    <section class="section">
      ${sectionHead('Jeux', { iconName: 'gamepad-2' })}
      ${games()}
    </section>

    ${
      top.length
        ? `<section class="section">
            ${sectionHead('Au coffre', { iconName: 'vault', link: `<a class="link-more" href="#/cartes">Tout le coffre${icon('arrow-right', { size: 15 })}</a>` })}
            <div class="tile-grid tile-grid--6">
              ${top.map((card) => cardTile(card, { tag: 'a', attrs: `href="#/cartes?q=${encodeURIComponent(card.name)}"`, extra: `<span class="tile__status">${icon('archive', { size: 13 })}×${qtyOf(card.id)} au coffre</span>` })).join('')}
            </div>
          </section>`
        : ''
    }

    <section class="section panel panel--pad" data-live>${feed()}</section>`;
  },
  mount(root) {
    const untilt = attachTilt(root.querySelector('[data-tilt]'), 12);
    const onClick = (e) => {
      const tab = e.target.closest('[data-feed]');
      if (!tab) return;
      ui.feed = tab.dataset.feed;
      root.querySelector('[data-live]').innerHTML = feed();
      root.querySelector('[data-feed].is-active')?.focus({ preventScroll: true });
    };
    root.addEventListener('click', onClick);
    return () => {
      untilt();
      root.removeEventListener('click', onClick);
    };
  },
};
