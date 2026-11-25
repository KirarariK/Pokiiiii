// Évolution : miser une carte du coffre pour tenter d'en obtenir une plus cotée.
//
// Chance de réussite = (cote misée / cote visée) × (1 − marge). La jauge montre
// exactement ce qui se joue : l'aiguille s'arrête à la position du ticket tiré,
// et la zone colorée couvre les tickets gagnants.

import { RULES } from '../config.js';
import { CARDS, cardById, cardRef } from '../catalog.js';
import { TICKETS } from '../fair.js';
import { esc, eur, num, pctFine } from '../format.js';
import { icon } from '../icons.js';
import { evolutionChance, evolve, getState, ownedByUid, vaultCards } from '../store.js';
import { emptyState, note, pageHead } from '../ui/blocks.js';
import { cardImage, cardTile } from '../ui/card.js';
import { burst, motionOk, sfx } from '../ui/effects.js';
import { confirmDialog, openModal, toast } from '../ui/modal.js';

const MULTIPLIERS = [1.5, 2, 3, 5, 10];
const R = 92; // rayon de la jauge
const CIRC = 2 * Math.PI * R;

/** Choix en cours, conservé tant qu'on reste sur la page. */
const ui = { stakeUid: null, targetId: null, last: null };

/** Cartes visées proposées : pour chaque multiplicateur, la carte dont la cote s'en approche le plus. */
function targetsFor(stake) {
  const floor = stake.value * RULES.evolution.minRatio;
  const pool = CARDS.filter((c) => c.value >= floor && c.id !== stake.cardId);
  const seen = new Set();
  const out = [];
  for (const m of MULTIPLIERS) {
    const want = stake.value * m;
    const best = pool.filter((c) => !seen.has(c.id)).reduce((top, c) => (!top || Math.abs(c.value - want) < Math.abs(top.value - want) ? c : top), null);
    if (!best) continue;
    seen.add(best.id);
    out.push({ card: best, multiplier: best.value / stake.value, chance: evolutionChance(stake.value, best.value) });
  }
  return out.sort((a, b) => a.card.value - b.card.value);
}

function gauge(chance) {
  const arc = chance * CIRC;
  return `<div class="gauge" data-gauge>
    <svg viewBox="0 0 220 220" aria-hidden="true">
      <circle class="gauge__track" cx="110" cy="110" r="${R}"/>
      <circle class="gauge__win" cx="110" cy="110" r="${R}" stroke-dasharray="${arc.toFixed(2)} ${(CIRC - arc).toFixed(2)}" transform="rotate(-90 110 110)"/>
    </svg>
    <span class="gauge__needle" data-needle><i></i></span>
    <span class="gauge__center"><strong data-chance>${chance ? pctFine(chance) : '—'}</strong><small>de réussite</small></span>
  </div>`;
}

function slot(title, body) {
  return `<section class="panel evo__slot"><h2>${title}</h2>${body}</section>`;
}

function openPicker(rerender) {
  const cards = vaultCards().sort((a, b) => b.value - a.value);
  openModal({
    title: 'Choisir la carte à miser',
    size: 'lg',
    body: `<p class="muted small">La carte misée quitte ton coffre : elle évolue en cas de réussite, elle est perdue en cas d'échec.</p>
      <div class="tile-grid">${cards
        .map((o) => cardTile(cardById(o.cardId), { rarity: o.rarity, value: o.value, tag: 'button', attrs: `type="button" data-pick="${o.uid}"` }))
        .join('')}</div>`,
    onMount(el, close) {
      el.addEventListener('click', (e) => {
        const pick = e.target.closest('[data-pick]');
        if (!pick) return;
        ui.stakeUid = pick.dataset.pick;
        ui.targetId = null;
        ui.last = null;
        close();
        rerender();
      });
    },
  });
}

export default {
  nav: 'evolution',
  title: 'Évolution',
  auth: true,

  render({ query }) {
    const { edge, maxChance } = RULES.evolution;
    // Arrivée depuis la collection avec une carte déjà choisie.
    if (query.carte && !ui.last && ownedByUid(query.carte)?.status === 'coffre') ui.stakeUid = query.carte;
    const head = pageHead({
      icon: 'chevrons-up',
      title: 'Évolution',
      lead: 'Mise une carte de ton coffre pour tenter de la faire évoluer en une carte plus cotée. Plus la cible est haute, plus la chance est mince.',
    });
    const vault = vaultCards();
    if (!vault.length && !ui.last) {
      return `${head}${emptyState({ iconName: 'vault', title: 'Aucune carte à miser', text: "Il te faut au moins une carte au coffre pour tenter une évolution.", action: '<a class="btn btn--primary" href="#/packs">Ouvrir un pack</a>' })}`;
    }

    const stake = ui.stakeUid ? ownedByUid(ui.stakeUid) : null;
    const stakeOk = stake && stake.status === 'coffre';
    const stakeCard = stake ? cardById(stake.cardId) : null;
    const targets = stakeOk ? targetsFor(stake) : [];
    if (stakeOk && !targets.some((t) => t.card.id === ui.targetId)) ui.targetId = targets[0]?.card.id || null;
    const target = targets.find((t) => t.card.id === ui.targetId) || null;
    const last = ui.last;

    const left = last
      ? `<span class="evo__card ${last.win ? '' : 'is-lost'}">${cardImage(cardById(last.stakeId), { hi: true })}</span>
         <p class="evo__name">${esc(cardById(last.stakeId).name)}</p><p class="muted">${last.win ? 'Carte consommée' : 'Carte perdue'}</p>`
      : stakeOk
        ? `<span class="evo__card">${cardImage(stakeCard, { hi: true })}</span>
           <p class="evo__name">${esc(stakeCard.name)}</p><p class="evo__value">${eur(stake.value)}</p>
           <button class="btn btn--secondary btn--sm" type="button" data-choose>${icon('refresh-cw', { size: 15 })}Changer de carte</button>`
        : `<button class="evo__empty" type="button" data-choose>${icon('plus', { size: 28 })}<span>Choisir une carte</span></button>
           <p class="muted small">${num(vault.length)} carte${vault.length > 1 ? 's' : ''} au coffre</p>`;

    const right = last
      ? `<span class="evo__card ${last.win ? 'is-won' : 'is-ghost'}">${cardImage(cardById(last.targetId), { hi: true })}</span>
         <p class="evo__name">${esc(cardById(last.targetId).name)}</p><p class="evo__value">${eur(cardById(last.targetId).value)}</p>`
      : target
        ? `<span class="evo__card is-ghost">${cardImage(target.card, { hi: true })}</span>
           <p class="evo__name">${esc(target.card.name)}</p><p class="evo__value">${eur(target.card.value)}</p>
           <p class="muted small">${esc(cardRef(target.card))} · ×${target.multiplier.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</p>`
        : `<div class="evo__empty evo__empty--static">${icon('target', { size: 28 })}<span>Carte visée</span></div><p class="muted small">Choisis d'abord la carte à miser.</p>`;

    const middle = last
      ? `${gauge(last.chance)}
         <p class="evo__verdict ${last.win ? 'is-win' : 'is-fail'}" data-verdict hidden>${icon(last.win ? 'sparkles' : 'circle-x', { size: 20 })}${last.win ? 'Évolution réussie !' : "L'évolution a échoué"}</p>
         <p class="small muted" data-ticket hidden>Ticket n° ${num(last.ticket)} · il fallait moins de ${num(last.winBelow)} · <a href="#/equite">vérifier</a></p>
         <div class="evo__after" data-after hidden>
           ${last.win ? `<a class="btn btn--secondary" href="#/collection">${icon('archive', { size: 16 })}Voir ma collection</a>` : ''}
           <button class="btn btn--primary" type="button" data-again>${icon('rotate-cw', { size: 16 })}Nouvelle tentative</button>
         </div>`
      : `${gauge(target ? target.chance : 0)}
         <button class="btn btn--primary btn--lg" type="button" data-evolve ${target ? '' : 'disabled'}>${icon('chevrons-up', { size: 20 })}Tenter l'évolution</button>
         <p class="small muted center">En cas d'échec, la carte misée est perdue.</p>`;

    return `
    ${head}
    <div class="evo">
      ${slot('Carte misée', left)}
      <section class="panel evo__core">${middle}<canvas class="evo__fx" aria-hidden="true"></canvas></section>
      ${slot('Carte visée', right)}
    </div>

    ${
      stakeOk && !last && targets.length
        ? `<section class="panel panel--pad">
            <div class="section__head"><h2>${icon('target', { size: 22 })}<span>Choisis ta cible</span></h2></div>
            <div class="evo__targets" role="radiogroup" aria-label="Carte visée">
              ${targets
                .map(
                  (t) => `<button class="evo__target" type="button" role="radio" aria-checked="${t.card.id === ui.targetId}" data-target="${t.card.id}">
                    <span class="evo__target-img">${cardImage(t.card)}</span>
                    <span class="evo__target-name">${esc(t.card.name)}</span>
                    <span class="evo__target-meta"><strong>${eur(t.card.value)}</strong><span>×${t.multiplier.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}</span></span>
                    <span class="evo__target-chance">${pctFine(t.chance)}</span>
                  </button>`,
                )
                .join('')}
            </div>
          </section>`
        : ''
    }

    <section class="panel panel--pad prose">
      <h2>${icon('info', { size: 22 })}Les règles</h2>
      <ul>
        <li><strong>Chance de réussite</strong> = cote misée ÷ cote visée × ${Math.round((1 - edge) * 100)} %, plafonnée à ${Math.round(maxChance * 100)} %.</li>
        <li><strong>Réussite</strong> : ta carte est remplacée par la carte visée, rangée dans ton coffre. <strong>Échec</strong> : la carte misée est perdue.</li>
        <li>En moyenne, une tentative rend <strong>${Math.round((1 - edge) * 100)} % de la cote misée</strong> : sur la durée, ce jeu coûte plus qu'il ne rapporte.</li>
        <li>Le tirage est <a href="#/equite">vérifiable</a> : la zone colorée de la jauge couvre exactement les tickets gagnants.</li>
      </ul>
      ${note("Démonstration : les cartes misées et gagnées ne sont pas adossées à un stock réel.", 'demo')}
    </section>`;
  },

  mount(root, { rerender }) {
    // Après une tentative : l'aiguille tourne jusqu'à la position du ticket, puis le verdict s'affiche.
    if (ui.last && !ui.last.shown) {
      const last = ui.last;
      last.shown = true;
      const needle = root.querySelector('[data-needle]');
      root.querySelector('.evo')?.scrollIntoView({ block: 'center' });
      const animated = motionOk();
      const fast = getState().settings.fast;
      const angle = (last.ticket / TICKETS) * 360;
      const duration = !animated ? 0 : fast ? 1200 : 4200;
      const settle = () => {
        root.querySelector('[data-gauge]')?.classList.add(last.win ? 'is-win' : 'is-fail');
        root.querySelectorAll('[data-verdict], [data-ticket], [data-after]').forEach((el) => {
          el.hidden = false;
        });
        if (last.win) {
          sfx.win();
          burst(root.querySelector('.evo__fx'), { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(), count: 140, power: 1.3 });
        } else sfx.fail();
      };
      if (needle) {
        needle.style.transition = duration ? `transform ${duration}ms cubic-bezier(0.12, 0.72, 0.1, 1)` : 'none';
        requestAnimationFrame(() => {
          needle.style.transform = `rotate(${(duration ? 5 * 360 : 0) + angle}deg)`;
        });
        if (duration) sfx.charge();
      }
      const timer = setTimeout(settle, duration + 80);
      root.dataset.evoTimer = String(timer);
    }

    const onClick = async (e) => {
      if (e.target.closest('[data-choose]')) {
        openPicker(rerender);
        return;
      }
      const pick = e.target.closest('[data-target]');
      if (pick) {
        ui.targetId = pick.dataset.target;
        rerender();
        return;
      }
      if (e.target.closest('[data-again]')) {
        ui.last = null;
        ui.stakeUid = null;
        ui.targetId = null;
        rerender();
        return;
      }
      if (e.target.closest('[data-evolve]')) {
        const stake = ownedByUid(ui.stakeUid);
        const target = cardById(ui.targetId);
        if (!stake || !target) return;
        const stakeCard = cardById(stake.cardId);
        const chance = evolutionChance(stake.value, target.value);
        const ok = await confirmDialog({
          title: "Tenter l'évolution ?",
          confirm: `Miser ${stakeCard.name}`,
          body: `<p>Tu mises <strong>${esc(stakeCard.name)}</strong> (${eur(stake.value)}) pour tenter d'obtenir <strong>${esc(target.name)}</strong> (${eur(target.value)}).</p>
                 <p>Chance de réussite : <strong>${pctFine(chance)}</strong>.</p>
                 <p class="muted small">En cas d'échec, ta carte est définitivement perdue.</p>`,
        });
        if (!ok) return;
        const res = evolve(stake.uid, target.id);
        if (!res.ok) {
          toast(res.message, 'error');
          return;
        }
        ui.last = { win: res.win, chance: res.chance, ticket: res.ticket, winBelow: res.winBelow, stakeId: stake.cardId, targetId: target.id, shown: false };
        rerender();
      }
    };
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      clearTimeout(Number(root.dataset.evoTimer));
      // En quittant la page, la tentative affichée est rangée : on repart d'une page vierge.
      if (ui.last?.shown && !location.hash.startsWith('#/evolution')) {
        ui.last = null;
        ui.stakeUid = null;
        ui.targetId = null;
      }
    };
  },
};
