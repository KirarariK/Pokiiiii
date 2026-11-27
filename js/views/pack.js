// Page d'un pack : visuel, répartitions, achat, plus grosses cartes, dernières ouvertures.

import { RULES } from '../config.js';
import { cardRef, dropTable, expectedValue, packAvailable, packEdge, packReturn, profitChance, tableVersion, topHits } from '../catalog.js';
import { recentOpenings } from '../data/community.js';
import { giveawayById, isActive } from '../data/giveaways.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { esc, eur, num, pctFine, plural } from '../format.js';
import { icon } from '../icons.js';
import { bonusStatus, buyPacks, getState, giveawayEntry, isLoggedIn, setSetting, wagerWeight } from '../store.js';
import { emptyState, oddsGrid, openingItem, packRange, sectionHead } from '../ui/blocks.js';
import { cardBack, cardImage, cardTile, rarityBadge } from '../ui/card.js';
import { drawFromPack } from '../draw.js';
import { openModal } from '../ui/modal.js';
import { countdownInline } from '../ui/countdown.js';
import { attachTilt, sfx } from '../ui/effects.js';
import { confirmDialog, toast } from '../ui/modal.js';
import { packArt, themeGlow } from '../ui/pack-art.js';
import { openTopup } from '../ui/topup.js';

/** Nombre de lignes de la table de tirage affichées avant « tout afficher ». */
const PREVIEW_ROWS = 12;
/** Packs dont l'essai s'est déjà ouvert tout seul : un nouveau rendu ne le rouvre pas. */
const tried = new Set();

function dropRow(d) {
  return `<tr data-rarity="${d.rarity}">
    <td><span class="drop"><span class="drop__img">${cardImage(d.card)}</span><span><strong>${esc(d.card.name)}</strong><small>${esc(cardRef(d.card))} · ${esc(d.card.set)}</small></span></span></td>
    <td>${rarityBadge(d.rarity)}</td>
    <td class="num">${eur(d.card.value)}</td>
    <td class="num">${d.copies === 1 ? '<span class="tag tag--last">dernier</span>' : `×${d.copies}`}</td>
    <td class="num"><strong>${pctFine(d.p)}</strong></td>
    <td class="num muted">${num(d.from)} – ${num(d.to - 1)}</td>
  </tr>`;
}

function giveawayBox(pack) {
  if (!pack.giveaway) return '';
  const g = giveawayById(pack.giveaway);
  if (!g || !isActive(g)) return '';
  const tickets = isLoggedIn() ? giveawayEntry(g.id).tickets : null;
  return `<div class="buy__gw">
    <div class="buy__gw-row">
      <span>${icon('ticket', { size: 16 })}Tes tickets</span>
      <strong>${tickets == null ? '–' : num(Number(tickets) || 0)}</strong>
    </div>
    <div class="buy__gw-row">
      <span>${icon('clock', { size: 16 })}Clôture dans</span>
      <strong>${countdownInline(g.end, 'long')}</strong>
    </div>
    <p class="small muted">1 pack = 1 ticket pour le <a href="#/giveaways/${g.id}">${esc(g.title)}</a>.</p>
  </div>`;
}

const QUANTITIES = [1, 2, 3, 5, 10].filter((n) => n <= RULES.maxPacksPerOrder);

/**
 * Essai gratuit : on tire dans la vraie table du pack, avec les mêmes probabilités,
 * sans solde ni compte. Rien n'est gagné, rien n'est dépensé, le coffre ne bouge pas.
 * Le bilan cumulé montre ce que les essais auraient coûté et rendu.
 */
function openTrial(pack) {
  const stats = { n: 0, value: 0, below: 0 };
  const rate = RULES.buybackRate;
  const view = (drop) => {
    const { card } = drop;
    const diff = card.value - pack.price;
    return `<div class="trial__card is-in" data-rarity="${drop.rarity}">${cardImage(card, { hi: true, lazy: false })}</div>
      <div class="trial__info">
        ${rarityBadge(drop.rarity)}
        <strong class="trial__name">${esc(card.name)}</strong>
        <span class="trial__value">${eur(card.value)}</span>
        <span class="${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : '−'}${eur(Math.abs(diff))} par rapport au prix du pack</span>
      </div>`;
  };
  const tally = () => {
    if (!stats.n) return `Chaque essai tire une carte dans la table du moment, comme un vrai achat.`;
    const paid = stats.n * pack.price;
    const back = Math.round(stats.value * rate);
    return `<strong>${plural(stats.n, 'essai', 'essais')}</strong> : ${eur(paid)} de packs, ${eur(stats.value)} de cote, ${eur(back)} en rachat immédiat. Bilan <strong class="${back >= paid ? 'pos' : 'neg'}">${back >= paid ? '+' : '−'}${eur(Math.abs(back - paid))}</strong> · ${stats.below} sur ${stats.n} sous le prix du pack.`;
  };
  openModal({
    title: `Essai gratuit · ${pack.name}`,
    body: `<p class="note note--demo">${icon('info', { size: 16 })}<span><strong>Mode essai :</strong> rien n'est gagné, rien n'est dépensé. Mêmes probabilités que le tirage réel.</span></p>
      <div class="trial" data-trial-stage><div class="trial__card">${cardBack()}</div><div class="trial__info"><strong class="trial__name">Prêt ?</strong><span class="muted">Lance un essai pour voir ce que ce pack donne.</span></div></div>
      <p class="trial__tally small" data-trial-tally aria-live="polite">${tally()}</p>`,
    footer: `<button class="btn btn--secondary" type="button" data-close>Fermer</button>
             <button class="btn btn--primary" type="button" data-trial-spin autofocus>${icon('sparkles', { size: 16 })}<span>Lancer un essai</span></button>`,
    onMount(el) {
      const spin = el.querySelector('[data-trial-spin]');
      spin.addEventListener('click', () => {
        if (!packAvailable(pack)) return;
        const drop = drawFromPack(pack);
        stats.n += 1;
        stats.value += drop.card.value;
        if (drop.card.value < pack.price) stats.below += 1;
        el.querySelector('[data-trial-stage]').innerHTML = view(drop);
        el.querySelector('[data-trial-tally]').innerHTML = tally();
        spin.querySelector('span').textContent = 'Encore un essai';
        // Un essai n'est pas une rafale : court délai entre deux tirages.
        spin.disabled = true;
        setTimeout(() => {
          spin.disabled = false;
          spin.focus({ preventScroll: true });
        }, 900);
      });
    },
  });
}

/** Panneau de jeu d'un pack en vente : ce qu'il rend, combien on en ouvre, un bouton. */
function buyPanel(pack, qty) {
  return `
        <div class="bet__facts">
          <div><small>Retour</small><strong>${pctFine(packReturn(pack))}</strong></div>
          <div><small>Cote moyenne</small><strong>${eur(expectedValue(pack))}</strong></div>
          <div><small>Carte ≥ prix</small><strong>${pctFine(profitChance(pack))}</strong></div>
        </div>
        ${oddsGrid(pack)}
        <div class="bet__qty" role="radiogroup" aria-label="Nombre de packs">
          ${QUANTITIES.map((n) => `<button class="bet__chip ${n === qty ? 'is-active' : ''}" type="button" role="radio" aria-checked="${n === qty}" data-qty="${n}">×${n}</button>`).join('')}
        </div>
        <button class="btn btn--primary btn--lg btn--block buy__cta" type="button" data-buy>
          ${icon('package-open', { size: 20 })}<span data-buy-label></span>
        </button>
        <button class="btn btn--secondary btn--block" type="button" data-try>${icon('sparkles', { size: 18 })}Essai gratuit · sans solde</button>
        <p class="small center"><strong>${pctFine(1 - profitChance(pack))}</strong> des tirages donnent une carte cotée moins que le prix du pack.</p>
        ${isLoggedIn() && bonusStatus().active && wagerWeight(packEdge(pack)) < 1 ? `<p class="small muted center">Bonus en cours : ce pack compte pour ${Math.round(wagerWeight(packEdge(pack)) * 100)} % de son prix dans tes mises.</p>` : ''}
        <p class="small muted center">${isLoggedIn() ? `Solde <strong>${eur(getState().balance)}</strong> · ` : ''}Rachat ${Math.round(RULES.buybackRate * 100)} % pendant ${RULES.buybackLockMinutes} min, ${Math.round(RULES.buybackLaterRate * 100)} % ensuite · <a href="#/equite">tirage vérifiable</a></p>`;
}

/** Panneau d'un pack que le coffre ne permet pas de composer. */
function outPanel() {
  return `<div class="buy__out">
    <strong>${icon('archive', { size: 18 })}En rupture</strong>
    <p class="muted">Le coffre ne contient pas assez de cartes pour composer ce pack en ce moment.</p>
    <a class="btn btn--secondary btn--block" href="#/packs">Voir les autres packs</a>
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
    const asked = Math.min(RULES.maxPacksPerOrder, Math.max(1, Number.parseInt(query.qty, 10) || 1));
    // La quantité se choisit parmi les jetons proposés : on retient le plus proche par défaut.
    const qty = QUANTITIES.reduce((best, n) => (Math.abs(n - asked) < Math.abs(best - asked) ? n : best), QUANTITIES[0]);
    const open = packAvailable(pack);
    const others = PACKS.filter((p) => p.slug !== pack.slug);
    const hits = topHits(pack, 10);
    const drops = dropTable(pack);
    const pulls = recentOpenings(pack.slug, 5);

    return `
    <a class="back-link" href="#/packs">${icon('arrow-left', { size: 16 })}Tous les packs</a>
    <div class="pack-page" style="--glow:${themeGlow(pack.theme)}">
      <div class="pack-page__left">
        <div class="pack-stage">
          ${open ? `<span class="badge badge--stock">${icon('check', { size: 13 })}En stock</span>` : `<span class="badge badge--out">Rupture</span>`}
          ${pack.event ? `<span class="badge badge--event">${icon('flame', { size: 13 })}Événement</span>` : ''}
          <span class="pack-stage__glow"></span>
          <span class="pack-stage__art" data-tilt>${packArt(pack, { lazy: false })}</span>
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
        <p class="muted">Cartes de ${packRange(pack)}${open ? ` · ${num(drops.length)} au coffre` : ''}</p>

        ${open ? buyPanel(pack, qty) : outPanel()}
      </section>
    </div>

    ${open ? `<section class="section panel panel--pad">
      ${sectionHead('Les plus gros hits', { iconName: 'star' })}
      <div class="tile-grid tile-grid--5">
        ${hits.map(({ card, rarity }) => cardTile(card, { rarity })).join('')}
      </div>
    </section>

    <section class="section panel panel--pad">
      ${sectionHead(`Contenu du pack · ${num(drops.length)} cartes`, { iconName: 'list' })}
      <p class="muted small">Table du coffre en direct : elle change à chaque carte qui entre ou sort. Version <code>${tableVersion(pack)}</code></p>
      <div class="table-wrap"><table class="table table--drops">
        <thead><tr><th>Carte</th><th>Rareté</th><th class="num">Cote</th><th class="num">Au coffre</th><th class="num">Probabilité</th><th class="num">Tickets</th></tr></thead>
        <tbody data-drops>${drops.slice(0, PREVIEW_ROWS).map(dropRow).join('')}</tbody>
      </table></div>
      ${drops.length > PREVIEW_ROWS ? `<button class="btn btn--secondary" type="button" data-drops-more>${icon('chevron-down', { size: 16 })}Afficher les ${num(drops.length)} cartes</button>` : ''}
    </section>` : ''}

    <section class="section panel panel--pad">
      ${sectionHead('Les dernières ouvertures', { iconName: 'zap', note: 'Flux simulé' })}
      <div class="pulls">
        ${pulls.length ? pulls.map((p) => openingItem(p)).join('') : '<p class="muted">Aucune ouverture récente.</p>'}
      </div>
    </section>
`;
  },

  mount(root, { params, query, navigate, rerender }) {
    const pack = packBySlug(params.slug);
    if (!pack) return null;

    const label = root.querySelector('[data-buy-label]');
    // Pack en rupture : pas de panneau de jeu, seul le visuel reste animé.
    if (!label) return attachTilt(root.querySelector('[data-tilt]'), 16);
    let qty = Number(root.querySelector('.bet__chip.is-active')?.dataset.qty) || 1;
    const paint = () => {
      label.textContent = `Ouvrir ${qty > 1 ? `${qty} packs` : ''} · ${eur(pack.price * qty)}`.replace('  ', ' ');
      root.querySelectorAll('.bet__chip').forEach((chip) => {
        const on = Number(chip.dataset.qty) === qty;
        chip.classList.toggle('is-active', on);
        chip.setAttribute('aria-checked', String(on));
      });
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
      // Premier achat : on rappelle que la carte est tirée dès la confirmation. Ensuite, un clic suffit.
      if (!getState().settings.instant) {
        const ok = await confirmDialog({
          title: "Confirmer l'ouverture",
          confirm: 'Ouvrir',
          body: `<p><strong>${plural(qty, 'pack', 'packs')} ${esc(pack.name)}</strong> pour <strong>${eur(total)}</strong> de crédits fictifs.</p>
                 <p class="muted small">Démonstration : rien n'est vendu. La carte est tirée dès que tu confirmes ; ce rappel ne s'affichera plus.</p>`,
        });
        if (!ok) return;
        setSetting('instant', true);
      }
      const res = buyPacks(pack.slug, qty);
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      sfx.tap();
      if (res.short) toast(`Le coffre n'a permis d'ouvrir que ${plural(res.pulls.length, 'pack', 'packs')} : tu n'as payé que ceux-là.`, 'info');
      navigate('/ouverture');
      return true;
    };
    /** Vrai pendant un achat, et après un achat réussi jusqu'au changement de page : un double clic n'achète pas deux fois. */
    let buying = false;

    const onClick = (e) => {
      const chip = e.target.closest('.bet__chip');
      if (chip) {
        qty = Number(chip.dataset.qty);
        paint();
        return;
      }
      if (e.target.closest('[data-try]')) {
        openTrial(pack);
        return;
      }
      const more = e.target.closest('[data-drops-more]');
      if (more) {
        root.querySelector('[data-drops]').innerHTML = dropTable(pack).map(dropRow).join('');
        more.remove();
        return;
      }
      if (e.target.closest('[data-buy]') && !buying) {
        buying = true;
        buy().then(
          (done) => {
            buying = done === true;
          },
          () => {
            buying = false;
          },
        );
      }
    };
    root.addEventListener('click', onClick);
    // Arrivée depuis « Essai gratuit » de l'accueil : la fenêtre d'essai s'ouvre d'elle-même.
    if (query.essai && !tried.has(pack.slug)) {
      tried.add(pack.slug);
      openTrial(pack);
    }
    const untilt = attachTilt(root.querySelector('[data-tilt]'), 16);
    return () => {
      root.removeEventListener('click', onClick);
      untilt();
    };
  },
};
