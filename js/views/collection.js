// Collection : cartes au coffre, en livraison et historique des reventes.

import { RULES } from '../config.js';
import { cardById, cardRef } from '../catalog.js';
import { RARITIES, packBySlug } from '../data/packs.js';
import { dateFr, esc, eur, eurShort, num, pct, plural } from '../format.js';
import { icon } from '../icons.js';
import { bonusStatus, buybackOf, buybackRate, canShip, getState, lockEnd, ownedByUid, requestShipment, sellCards, shippingFee, shippingInsurance, stats, withdrawable } from '../store.js';
import { emptyState, pageHead, statTile } from '../ui/blocks.js';
import { cardImage, cardTile, rarityBadge } from '../ui/card.js';
import { countdownInline, refreshCountdowns } from '../ui/countdown.js';
import { attachTilt, sfx } from '../ui/effects.js';
import { confirmDialog, openModal, toast } from '../ui/modal.js';
import { openTopup } from '../ui/topup.js';

const TABS = [
  { key: 'coffre', label: 'Au coffre', icon: 'vault' },
  { key: 'livraison', label: 'En livraison', icon: 'truck' },
  { key: 'historique', label: 'Historique', icon: 'history' },
];

const PAST = ['vendue', 'evoluee', 'perdue'];
const inTab = (owned, tab) => (tab === 'historique' ? PAST.includes(owned.status) : owned.status === tab);

const SORTS = {
  recent: { label: 'Plus récentes', fn: (a, b) => b.at - a.at },
  high: { label: 'Cote décroissante', fn: (a, b) => b.value - a.value },
  low: { label: 'Cote croissante', fn: (a, b) => a.value - b.value },
};

/** Réglages d'affichage, conservés tant qu'on reste sur la page. */
const ui = { tab: 'coffre', rarity: 'all', sort: 'recent', selected: new Set() };

function visibleCards() {
  return getState()
    .cards.filter((c) => inTab(c, ui.tab) && (ui.rarity === 'all' || c.rarity === ui.rarity))
    .sort(SORTS[ui.sort].fn);
}

function tileFor(owned) {
  const card = cardById(owned.cardId);
  if (!card) return '';
  const selectable = ui.tab === 'coffre';
  const checked = ui.selected.has(owned.uid);
  const extra =
    {
      vendue: `<span class="tile__status">${icon('check', { size: 14 })}Revendue ${eur(owned.soldFor)}</span>`,
      evoluee: `<span class="tile__status">${icon('chevrons-up', { size: 14 })}A évolué</span>`,
      perdue: `<span class="tile__status tile__status--lost">${icon('circle-x', { size: 14 })}Perdue en évolution</span>`,
      livraison: `<span class="tile__status">${icon('truck', { size: 14 })}En préparation</span>`,
    }[owned.status] || '';
  return `<div class="tile-wrap ${checked ? 'is-selected' : ''}">
    ${selectable ? `<label class="tile-check" title="Sélectionner"><input type="checkbox" data-select="${esc(owned.uid)}" ${checked ? 'checked' : ''}><span class="sr-only">Sélectionner ${esc(card.name)}</span></label>` : ''}
    ${cardTile(card, { rarity: owned.rarity, value: owned.value, tag: 'button', attrs: `type="button" data-detail="${esc(owned.uid)}"`, extra })}
  </div>`;
}

function selectionBar() {
  const picked = [...ui.selected].map(ownedByUid).filter((o) => o && o.status === 'coffre');
  if (!picked.length) return '';
  const total = picked.reduce((s, o) => s + buybackOf(o), 0);
  return `<div class="selbar" role="region" aria-label="Actions sur la sélection">
    <span class="selbar__count">${plural(picked.length, 'carte sélectionnée', 'cartes sélectionnées')}</span>
    <span class="selbar__actions">
      <button class="btn btn--ghost btn--sm" type="button" data-clear>Annuler</button>
      <button class="btn btn--secondary btn--sm" type="button" data-ship>${icon('truck', { size: 16 })}Faire livrer</button>
      <button class="btn btn--primary btn--sm" type="button" data-sell-selected>${icon('hand-coins', { size: 16 })}Revendre ${eur(total)}</button>
    </span>
  </div>`;
}

function openDetail(uid, rerender) {
  const owned = ownedByUid(uid);
  const card = owned && cardById(owned.cardId);
  if (!card) return;
  const pack = packBySlug(owned.pack);
  const inVault = owned.status === 'coffre';
  let untilt = () => {};
  openModal({
    title: card.name,
    size: 'lg',
    body: `<div class="detail" data-rarity="${esc(owned.rarity)}">
      <div class="detail__art"><span class="detail__card" data-tilt>${cardImage(card, { hi: true, lazy: false })}<span class="holo" aria-hidden="true"></span></span></div>
      <div class="detail__info">
        ${rarityBadge(owned.rarity, 'badge--lg')}
        <dl class="kv">
          <div><dt>Extension</dt><dd>${esc(card.set)}</dd></div>
          <div><dt>Référence</dt><dd>${esc(cardRef(card))}</dd></div>
          <div><dt>Rareté imprimée</dt><dd>${esc(card.tcgRarity)}</dd></div>
          <div><dt>Nom imprimé</dt><dd>${esc(card.nameEn)}</dd></div>
          <div><dt>Obtenue le</dt><dd>${dateFr(owned.at)} · ${pack ? esc(pack.name) : 'Évolution'}</dd></div>
          ${owned.roll ? `<div><dt>Tirage</dt><dd>ticket n° ${num(owned.roll.ticket)} · <a href="#/equite" data-close>vérifier</a></dd></div>` : ''}
          <div><dt>Cote indicative</dt><dd><strong>${eur(owned.value)}</strong></dd></div>
          ${inVault ? `<div><dt>Rachat</dt><dd><strong>${eur(buybackOf(owned))}</strong> <span class="muted">(${Math.round(buybackRate(owned) * 100)} %${Date.now() < lockEnd(owned) ? `, garanti encore ${countdownInline(lockEnd(owned), 'mmss')}` : ''})</span></dd></div>` : ''}
          ${owned.status === 'vendue' ? `<div><dt>Revendue</dt><dd>${eur(owned.soldFor)} le ${dateFr(owned.soldAt)}</dd></div>` : ''}
          ${owned.status === 'livraison' ? `<div><dt>Statut</dt><dd>En préparation · <a href="#/livraisons" data-close>suivre</a></dd></div>` : ''}
        </dl>
      </div>
    </div>`,
    footer: inVault
      ? `<a class="btn btn--ghost" href="#/evolution?carte=${owned.uid}" data-close>${icon('chevrons-up', { size: 16 })}Faire évoluer</a>
         <button class="btn btn--secondary" type="button" data-detail-ship>${icon('truck', { size: 16 })}Faire livrer</button>
         <button class="btn btn--primary" type="button" data-detail-sell>${icon('hand-coins', { size: 16 })}Revendre ${eur(buybackOf(owned))}</button>`
      : '',
    onMount(el, close) {
      refreshCountdowns(el);
      untilt = attachTilt(el.querySelector('[data-tilt]'), 12);
      el.querySelector('[data-detail-sell]')?.addEventListener('click', async () => {
        close();
        await sellFlow([uid], rerender);
      });
      el.querySelector('[data-detail-ship]')?.addEventListener('click', () => {
        close();
        openShipping([uid], rerender);
      });
    },
    onClose: () => untilt(),
  });
}

async function sellFlow(uids, rerender) {
  const picked = uids.map(ownedByUid).filter((o) => o && o.status === 'coffre');
  if (!picked.length) return;
  const total = picked.reduce((s, o) => s + buybackOf(o), 0);
  const ok = await confirmDialog({
    title: picked.length > 1 ? 'Revendre ces cartes ?' : 'Revendre cette carte ?',
    confirm: `Revendre pour ${eur(total)}`,
    body: `<p>${plural(picked.length, 'carte quittera', 'cartes quitteront')} ton coffre et <strong>${eur(total)}</strong> seront crédités sur ton solde, soit ${Math.round((total / picked.reduce((s, o) => s + o.value, 0)) * 100)} % de la cote.</p>
           <p class="muted small">La revente est définitive.</p>`,
  });
  if (!ok) return;
  const res = sellCards(picked.map((o) => o.uid));
  if (!res.ok) {
    toast(res.message, 'error');
    return;
  }
  sfx.coins();
  ui.selected.clear();
  toast(`${plural(res.count, 'carte revendue', 'cartes revendues')} : +${eur(res.total)}.`, 'success');
  rerender();
}

function openShipping(uids, rerender) {
  const picked = uids.map(ownedByUid).filter((o) => o && o.status === 'coffre');
  if (!picked.length) return;
  if (picked.some((o) => !canShip(o))) {
    toast("Une carte payée avec un bonus ne s'expédie qu'une fois le bonus joué. D'ici là, tu peux la garder au coffre ou la revendre.", 'info');
    return;
  }
  const zones = Object.entries(RULES.shipping);
  const value = picked.reduce((sum, o) => sum + o.value, 0);
  const insurance = shippingInsurance(value);
  const feeLine = (zone) => `${eur(shippingFee(zone, picked.length, value))} · ${RULES.shipping[zone].delay}`;

  openModal({
    title: 'Demander la livraison',
    body: `<form class="form" data-ship-form novalidate>
      <p class="muted">${plural(picked.length, 'carte sera retirée', 'cartes seront retirées')} du coffre, emballée${picked.length > 1 ? 's' : ''} et envoyée${picked.length > 1 ? 's' : ''} en suivi.</p>
      <p class="note note--demo">${icon('info', { size: 16 })}<span><strong>Démonstration :</strong> rien n'est expédié. N'entre pas ta vraie adresse : elle resterait en clair dans ce navigateur.</span></p>
      <div class="field">
        <label for="ship-zone">Destination</label>
        <select class="input" id="ship-zone" name="zone">
          ${zones.map(([key, z]) => `<option value="${key}">${esc(z.label)}</option>`).join('')}
        </select>
      </div>
      <div class="field"><label for="ship-name">Nom complet</label><input class="input" id="ship-name" name="name" autocomplete="name" required maxlength="80"></div>
      <div class="field"><label for="ship-line1">Adresse</label><input class="input" id="ship-line1" name="line1" autocomplete="address-line1" required maxlength="120"></div>
      <div class="field"><label for="ship-line2">Complément <span class="muted">(facultatif)</span></label><input class="input" id="ship-line2" name="line2" autocomplete="address-line2" maxlength="120"></div>
      <div class="field-row">
        <div class="field"><label for="ship-zip">Code postal</label><input class="input" id="ship-zip" name="zip" autocomplete="postal-code" required maxlength="12" inputmode="numeric"></div>
        <div class="field"><label for="ship-city">Ville</label><input class="input" id="ship-city" name="city" autocomplete="address-level2" required maxlength="80"></div>
      </div>
      <p class="fee">${icon('truck', { size: 16 })}<span>Frais et délai : <strong data-fee>${feeLine(zones[0][0])}</strong></span></p>
      ${insurance ? `<p class="small muted">Dont ${eur(insurance)} d'envoi en valeur déclarée : ${pct(RULES.shippingInsurance.rate * 100)} de la cote expédiée au-delà de ${eurShort(RULES.shippingInsurance.from)}.</p>` : ''}
      <p class="small muted">Dans tous les cas, la perte et la casse restent à la charge du vendeur jusqu'à la remise du colis.</p>
      <p class="form__error" data-error role="alert" hidden></p>
    </form>`,
    footer: `<button class="btn btn--secondary" type="button" data-close>Annuler</button>
             <button class="btn btn--primary" type="button" data-ship-confirm>Valider la demande</button>`,
    onMount(el, close) {
      const form = el.querySelector('[data-ship-form]');
      const error = el.querySelector('[data-error]');
      form.zone.addEventListener('change', () => {
        el.querySelector('[data-fee]').textContent = feeLine(form.zone.value);
      });
      const submit = (e) => {
        e?.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const fee = shippingFee(data.zone, picked.length, value);
        // Les frais se règlent avec l'argent du joueur, pas avec des fonds de bonus.
        if (withdrawable() < fee) {
          if (bonusStatus().active) {
            error.textContent = `Les frais de livraison se règlent hors bonus : il te manque ${eur(fee - withdrawable())} d'argent déposé.`;
            error.hidden = false;
            return;
          }
          close();
          openTopup({ need: fee - withdrawable() });
          return;
        }
        const res = requestShipment({ uids: picked.map((o) => o.uid), zone: data.zone, address: data });
        if (!res.ok) {
          error.textContent = res.message;
          error.hidden = false;
          return;
        }
        ui.selected.clear();
        close();
        toast('Demande de livraison enregistrée.', 'success');
        rerender();
      };
      form.addEventListener('submit', submit);
      el.querySelector('[data-ship-confirm]').addEventListener('click', submit);
    },
  });
}

export default {
  nav: 'collection',
  title: 'Collection',
  auth: true,

  render() {
    const state = getState();
    const s = stats();
    const counts = Object.fromEntries(TABS.map((t) => [t.key, state.cards.filter((c) => inTab(c, t.key)).length]));
    const cards = visibleCards();
    const pending = state.pending.length;

    const head = pageHead({
      icon: 'archive',
      title: 'Ma collection',
    });

    if (!state.cards.length) {
      return `${head}${emptyState({
        iconName: 'vault',
        title: 'Ton coffre est vide',
        text: 'Ouvre ton premier pack : la carte arrivera ici.',
        action: '<a class="btn btn--primary" href="#/packs">Voir les packs</a>',
      })}`;
    }

    return `
    ${head}
    ${pending ? `<a class="pending" href="#/ouverture">${icon('sparkles', { size: 18 })}<span><strong>${plural(pending, 'carte attend', 'cartes attendent')} d'être révélée${pending > 1 ? 's' : ''}.</strong> Reprendre l'ouverture</span>${icon('arrow-right', { size: 16 })}</a>` : ''}

    <div class="stats">
      ${statTile({ iconName: 'vault', label: 'Cartes au coffre', value: String(s.vaultCount) })}
      ${statTile({ iconName: 'gem', label: 'Cote du coffre', value: eur(s.vaultValue), hint: 'cotes indicatives' })}
      ${statTile({ iconName: 'hand-coins', label: 'Valeur de rachat', value: eur(s.vaultBuyback), hint: `${Math.round(RULES.buybackRate * 100)} % pendant ${RULES.buybackLockMinutes} min, ${Math.round(RULES.buybackLaterRate * 100)} % ensuite` })}
    </div>

    <div class="toolbar">
      <div class="tabs" role="tablist" aria-label="État des cartes">
        ${TABS.map((t) => `<button class="tab ${ui.tab === t.key ? 'is-active' : ''}" type="button" role="tab" aria-selected="${ui.tab === t.key}" data-tab="${t.key}">${icon(t.icon, { size: 16 })}${t.label}<span class="tab__count">${counts[t.key]}</span></button>`).join('')}
      </div>
      <div class="toolbar__filters">
        <label class="select"><span class="sr-only">Rareté</span>
          <select class="input input--sm" data-rarity-filter>
            <option value="all">Toutes les raretés</option>
            ${Object.entries(RARITIES).map(([key, r]) => `<option value="${key}" ${ui.rarity === key ? 'selected' : ''}>${r.label}</option>`).join('')}
          </select>
        </label>
        <label class="select"><span class="sr-only">Tri</span>
          <select class="input input--sm" data-sort>
            ${Object.entries(SORTS).map(([key, v]) => `<option value="${key}" ${ui.sort === key ? 'selected' : ''}>${v.label}</option>`).join('')}
          </select>
        </label>
      </div>
    </div>

    ${
      cards.length
        ? `<div class="tile-grid tile-grid--5">${cards.map(tileFor).join('')}</div>`
        : emptyState({ iconName: 'search', title: 'Aucune carte ici', text: ui.rarity === 'all' ? "Rien dans cet onglet pour l'instant." : 'Aucune carte de cette rareté dans cet onglet.' })
    }
    ${ui.tab === 'livraison' && cards.length ? `<p class="center"><a class="btn btn--secondary" href="#/livraisons">${icon('truck', { size: 16 })}Suivre mes livraisons</a></p>` : ''}
    ${selectionBar()}`;
  },

  mount(root, { rerender }) {
    const onClick = (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) {
        ui.tab = tab.dataset.tab;
        ui.selected.clear();
        rerender();
        return;
      }
      const detail = e.target.closest('[data-detail]');
      if (detail) {
        openDetail(detail.dataset.detail, rerender);
        return;
      }
      if (e.target.closest('[data-clear]')) {
        ui.selected.clear();
        rerender();
        return;
      }
      if (e.target.closest('[data-sell-selected]')) {
        sellFlow([...ui.selected], rerender);
        return;
      }
      if (e.target.closest('[data-ship]')) openShipping([...ui.selected], rerender);
    };
    const onChange = (e) => {
      const select = e.target.closest('[data-select]');
      if (select) {
        if (select.checked) ui.selected.add(select.dataset.select);
        else ui.selected.delete(select.dataset.select);
        rerender();
        return;
      }
      if (e.target.matches('[data-rarity-filter]')) {
        ui.rarity = e.target.value;
        rerender();
        return;
      }
      if (e.target.matches('[data-sort]')) {
        ui.sort = e.target.value;
        rerender();
      }
    };
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
    };
  },
};
