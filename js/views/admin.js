// Espace admin : connexion, puis les tableaux de pilotage du site.
//   Aperçu      état du coffre et alertes
//   Stock       tout le catalogue : au coffre ou non, exemplaires, cote retenue
//   Packs       ce que le coffre permet de vendre, palier par palier
//   Livraisons  demandes à préparer et à expédier
//   Mouvements  argent entré et sorti
//   Pilotage    compte de résultat et simulateur (js/views/pilotage.js)
// En production, cet espace et ses données vivent côté serveur.

import { MIN_PASSWORD, adminConfigured, adminUser, isAdmin, loginAdmin, logoutAdmin, setupAdmin } from '../admin.js';
import { cardById, cardRef, fitsPack, packReturn, packTable, stockCards, topHits } from '../catalog.js';
import { KINDS, cardRecord, fold, loadCatalogue } from '../catalogue.js';
import { RULES } from '../config.js';
import { isActive, listGiveaways } from '../data/giveaways.js';
import { PACKS, RARITIES } from '../data/packs.js';
import { dateTimeFr, esc, eur, eurShort, num, pct, plural } from '../format.js';
import { icon } from '../icons.js';
import { clearStock, exportStock, importStock, priceOverride, qtyOf, resetStock, setPrice, setStock, setStockMany, usingDemoStock } from '../stock.js';
import { getState, holdBackOwnedCards, houseLedger, ownedByUid, updateShipment } from '../store.js';
import { emptyState, note, pageHead, statTile } from '../ui/blocks.js';
import { confirmDialog, toast } from '../ui/modal.js';
import pilotage from './pilotage.js';

const TABS = [
  ['apercu', 'Aperçu', 'layout-dashboard'],
  ['stock', 'Stock', 'boxes'],
  ['packs', 'Packs', 'package'],
  ['livraisons', 'Livraisons', 'truck'],
  ['mouvements', 'Mouvements', 'receipt'],
  ['pilotage', 'Pilotage', 'trending-up'],
];

const PAGE_SIZE = 50;

/** Filtres du tableau de stock, gardés tant qu'on reste dans l'espace admin. */
const ui = { q: '', set: '', kind: '', stock: 'all', min: '', sort: 'value', page: 0, cat: null, error: '' };

const percent = (x) => `${(x * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/* ----------------------------------------------------------------- accès */

function gate() {
  const setup = !adminConfigured();
  return `
  <section class="auth">
    <div class="panel panel--pad auth__card">
      <h1>${icon('key-round', { size: 24 })}Espace admin</h1>
      <form class="form" data-admin-auth novalidate>
        <div class="field"><label for="adm-user">Identifiant</label><input class="input" id="adm-user" name="user" autocomplete="username" required></div>
        <div class="field"><label for="adm-pass">Mot de passe</label><input class="input" id="adm-pass" name="password" type="password" autocomplete="${setup ? 'new-password' : 'current-password'}" required minlength="${MIN_PASSWORD}"></div>
        ${setup ? `<div class="field"><label for="adm-pass2">Confirmer le mot de passe</label><input class="input" id="adm-pass2" name="confirm" type="password" autocomplete="new-password" required></div>` : ''}
        <p class="form__error" data-error role="alert" hidden></p>
        <button class="btn btn--primary btn--lg btn--block" type="submit">${icon(setup ? 'user-plus' : 'log-in', { size: 18 })}${setup ? "Créer l'accès" : 'Entrer'}</button>
      </form>
      ${note(setup ? `Première visite : choisis l'identifiant et le mot de passe (${MIN_PASSWORD} caractères au moins). L'accès est propre à cet appareil tant qu'il n'y a pas de serveur.` : 'Accès propre à cet appareil.', 'demo')}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- aperçu */

function stockTotals() {
  const cards = stockCards();
  let copies = 0;
  let value = 0;
  for (const c of cards) {
    const q = qtyOf(c.id);
    copies += q;
    value += q * c.value;
  }
  return { refs: cards.length, copies, value };
}

function overview() {
  const t = stockTotals();
  const tables = PACKS.map((pack) => ({ pack, table: packTable(pack) }));
  const out = tables.filter((x) => !x.table.ok);
  const { shipments } = getState();
  const todo = shipments.filter((s) => s.status === 'preparation').length;
  const gw = listGiveaways().filter((g) => isActive(g));
  const alerts = [
    ...(usingDemoStock() ? [['info', `Le coffre tourne sur le <strong>stock de démonstration</strong>. Vide-le avant de saisir ton inventaire réel, dans l'onglet <a href="#/admin/stock">Stock</a>.`]] : []),
    ...out.map(({ pack, table }) => ['warn', `<strong>${esc(pack.name)}</strong> est en rupture. ${esc(table.message)}`]),
    ...gw.filter((g) => !g.lots.length).map((g) => ['warn', `<strong>${esc(g.title)}</strong> : aucun lot au coffre.`]),
    ...(todo ? [['info', `${plural(todo, 'livraison', 'livraisons')} à préparer : onglet <a href="#/admin/livraisons">Livraisons</a>.`]] : []),
  ];
  return `
  <div class="stats stats--4">
    ${statTile({ iconName: 'boxes', label: 'Références au coffre', value: num(t.refs) })}
    ${statTile({ iconName: 'archive', label: 'Exemplaires', value: num(t.copies) })}
    ${statTile({ iconName: 'gem', label: 'Valeur du coffre', value: eurShort(Math.round(t.value / 100) * 100), hint: 'en cote' })}
    ${statTile({ iconName: 'package', label: 'Packs en vente', value: `${PACKS.length - out.length} / ${PACKS.length}` })}
  </div>
  <section class="panel panel--pad">
    <div class="section__head"><h2>${icon('triangle-alert', { size: 22 })}<span>À traiter</span></h2></div>
    ${alerts.length ? alerts.map(([type, html]) => note(html, type)).join('') : `<p class="muted">Rien à signaler.</p>`}
  </section>`;
}

/* ----------------------------------------------------------------- stock */

function filtered() {
  const { cat } = ui;
  if (!cat) return [];
  const q = fold(ui.q.trim());
  const min = Math.round((Number.parseFloat(String(ui.min).replace(',', '.')) || 0) * 100);
  const kind = ui.kind === '' ? -1 : Number(ui.kind);
  const list = cat.cards.filter((c) => {
    if (q && !c.q.includes(q)) return false;
    if (ui.set && c.setId !== ui.set) return false;
    if (kind >= 0 && c.kind !== kind) return false;
    if (min && c.value < min) return false;
    if (ui.stock !== 'all' && (qtyOf(c.id) > 0) !== (ui.stock === 'in')) return false;
    return true;
  });
  if (ui.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id));
  else if (ui.sort === 'set') list.sort((a, b) => a.setId.localeCompare(b.setId) || a.number.localeCompare(b.number, 'en', { numeric: true }));
  else list.sort((a, b) => b.value - a.value || a.id.localeCompare(b.id));
  return list;
}

/** Cote d'une carte du catalogue telle que le site la retient. */
const priceOf = (card) => priceOverride(card.id) ?? card.value;

function stockRow(card) {
  const qty = qtyOf(card.id);
  const value = priceOf(card);
  const packs = value ? PACKS.filter((p) => fitsPack({ ...card, value }, p)).map((p) => p.short) : [];
  return `<tr data-id="${esc(card.id)}" class="${qty ? 'is-in' : ''}">
    <td><span class="drop"><span class="drop__img"><span class="tcg"><img src="${esc(card.img)}" alt="" width="245" height="342" loading="lazy" decoding="async"></span></span><span><strong>${esc(card.name)}</strong><small>${card.name !== card.nameEn ? `${esc(card.nameEn)} · ` : ''}${esc(card.set)} · ${esc(cardRef(card))}</small></span></span></td>
    <td class="small">${esc(KINDS[card.kind] || '')}${card.tcgRarity ? `<br><span class="muted">${esc(card.tcgRarity)}</span>` : ''}</td>
    <td class="num">${
      qty
        ? `<input class="input input--sm stock__price" type="number" inputmode="decimal" min="0" step="0.01" value="${(value / 100).toFixed(2)}" data-price aria-label="Cote retenue pour ${esc(card.name)}">`
        : value
          ? eur(value)
          : '<span class="muted">inconnue</span>'
    }</td>
    <td class="small">${packs.length ? packs.map((p) => `<span class="tag">${esc(p)}</span>`).join('') : `<span class="muted">${value ? 'aucun pack' : '—'}</span>`}</td>
    <td class="num"><label class="switch" title="Au coffre"><input type="checkbox" data-toggle ${qty ? 'checked' : ''} aria-label="${esc(card.name)} au coffre"><span class="switch__track"></span></label></td>
    <td class="num"><span class="qty"><button class="btn btn--icon btn--secondary btn--sm" type="button" data-dec aria-label="Un exemplaire de moins" ${qty ? '' : 'disabled'}>${icon('minus', { size: 14 })}</button><output>${qty}</output><button class="btn btn--icon btn--secondary btn--sm" type="button" data-inc aria-label="Un exemplaire de plus">${icon('plus', { size: 14 })}</button></span></td>
  </tr>`;
}

function stockSummary() {
  const t = stockTotals();
  return `<strong>${num(t.refs)}</strong> ${t.refs > 1 ? 'références' : 'référence'} au coffre · <strong>${num(t.copies)}</strong> ${t.copies > 1 ? 'exemplaires' : 'exemplaire'} · <strong>${eurShort(Math.round(t.value / 100) * 100)}</strong> en cote${usingDemoStock() ? ` <span class="simulated">${icon('info', { size: 13 })}Stock de démonstration</span>` : ''}`;
}

function stockTable() {
  if (ui.error) return note(`${esc(ui.error)} Le tableau ne montre que les cartes déjà connues du site.`, 'warn');
  if (!ui.cat) return `<p class="muted center">Chargement du catalogue…</p>`;
  const list = filtered();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  ui.page = Math.min(ui.page, pages - 1);
  const rows = list.slice(ui.page * PAGE_SIZE, (ui.page + 1) * PAGE_SIZE);
  if (!list.length) return emptyState({ iconName: 'search', title: 'Aucune carte', text: 'Aucune carte ne correspond à ces filtres.' });
  return `
  <div class="toolbar">
    <span class="muted small">${num(list.length)} ${list.length > 1 ? 'cartes' : 'carte'} · page ${ui.page + 1} / ${num(pages)}</span>
    <div class="toolbar__filters">
      <button class="btn btn--secondary btn--sm" type="button" data-bulk="in">${icon('check', { size: 15 })}Tout mettre au coffre</button>
      <button class="btn btn--secondary btn--sm" type="button" data-bulk="out">${icon('x', { size: 15 })}Tout retirer</button>
      <button class="btn btn--icon btn--secondary btn--sm" type="button" data-page="-1" aria-label="Page précédente" ${ui.page ? '' : 'disabled'}>${icon('chevron-left', { size: 16 })}</button>
      <button class="btn btn--icon btn--secondary btn--sm" type="button" data-page="1" aria-label="Page suivante" ${ui.page < pages - 1 ? '' : 'disabled'}>${icon('chevron-right', { size: 16 })}</button>
    </div>
  </div>
  <div class="table-wrap"><table class="table table--stock">
    <thead><tr><th>Carte</th><th>Nature</th><th class="num">Cote</th><th>Packs</th><th class="num">Au coffre</th><th class="num">Exemplaires</th></tr></thead>
    <tbody>${rows.map(stockRow).join('')}</tbody>
  </table></div>`;
}

function stockTab() {
  const sets = ui.cat ? [...ui.cat.sets].sort((a, b) => b.date.localeCompare(a.date)) : [];
  const option = (value, label, current) => `<option value="${esc(value)}" ${String(current) === String(value) ? 'selected' : ''}>${esc(label)}</option>`;
  return `
  <section class="panel panel--pad">
    <div class="toolbar">
      <p data-stock-summary>${stockSummary()}</p>
      <div class="toolbar__filters">
        <button class="btn btn--secondary btn--sm" type="button" data-export>${icon('download', { size: 15 })}Exporter</button>
        <label class="btn btn--secondary btn--sm">${icon('upload', { size: 15 })}Importer<input type="file" accept="application/json,.json" data-import hidden></label>
        <button class="btn btn--secondary btn--sm" type="button" data-clear>${icon('trash-2', { size: 15 })}Vider le coffre</button>
        <button class="btn btn--ghost btn--sm" type="button" data-reset>${icon('rotate-ccw', { size: 15 })}Stock de départ</button>
      </div>
    </div>
    <div class="stock__filters">
      <input class="input" type="search" placeholder="Nom, extension ou numéro" value="${esc(ui.q)}" data-f="q" aria-label="Rechercher une carte">
      <select class="input" data-f="set" aria-label="Extension"><option value="">Toutes les extensions</option>${sets.map((s) => option(s.id, `${s.name} (${s.count})`, ui.set)).join('')}</select>
      <select class="input" data-f="kind" aria-label="Nature">${option('', 'Toutes natures', ui.kind)}${KINDS.map((k, i) => option(i, k, ui.kind)).join('')}</select>
      <select class="input" data-f="stock" aria-label="Présence au coffre">${option('all', 'Au coffre ou non', ui.stock)}${option('in', 'Au coffre', ui.stock)}${option('out', 'Pas au coffre', ui.stock)}</select>
      <input class="input" type="number" min="0" step="1" placeholder="Cote min. (€)" value="${esc(ui.min)}" data-f="min" aria-label="Cote minimale en euros">
      <select class="input" data-f="sort" aria-label="Tri">${option('value', 'Les plus cotées', ui.sort)}${option('name', 'Par nom', ui.sort)}${option('set', 'Par extension', ui.sort)}</select>
    </div>
    <div class="stack" data-stock-table>${stockTable()}</div>
  </section>`;
}

/* ----------------------------------------------------------------- packs */

function packsTab() {
  return `
  <section class="panel panel--pad">
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Pack</th><th class="num">Prix</th><th>État</th><th class="num">Retour</th><th class="num">Cartes</th><th>Paliers : cartes · probabilité</th><th>Plus gros lot</th></tr></thead>
      <tbody>
        ${PACKS.map((pack) => {
          const table = packTable(pack);
          const top = topHits(pack, 1)[0];
          return `<tr>
            <th scope="row" class="nowrap"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th>
            <td class="num">${eur(pack.price)}</td>
            <td>${table.ok ? `<span class="badge badge--stock">En vente</span>` : `<span class="badge badge--out">Rupture</span>`}</td>
            <td class="num">${table.ok ? `<strong>${percent(packReturn(pack))}</strong><br>` : ''}<span class="muted small">cible ${Math.round(pack.target * 100)} %</span></td>
            <td class="num">${table.ok ? num(table.drops.length) : '—'}</td>
            <td>${table.tiers.map((t) => `<span class="tag ${t.count ? '' : 'tag--empty'}" title="${RARITIES[t.rarity].label} : ${t.min} à ${t.max} €">${t.min}–${t.max} € · ${t.count}${t.count && table.ok ? ` · ${pct(t.p * 100)}` : ''}</span>`).join('')}${table.ok ? '' : `<p class="small neg">${esc(table.message)}</p>`}</td>
            <td class="small">${top ? `${esc(top.card.name)}<br><span class="muted">${eur(top.card.value)}</span>` : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table></div>
    <p class="small muted">Les probabilités sont recalculées à chaque mouvement du coffre pour que le retour reste sur la cible. Un pack passe en rupture s'il lui manque des paliers (${RULES.minTiers} au moins) ou si le coffre ne permet pas d'atteindre le retour annoncé.</p>
  </section>`;
}

/* ------------------------------------------------------------ livraisons */

const SHIP_STATUS = { preparation: 'À préparer', expediee: 'Expédiée', livree: 'Livrée' };

function shipmentsTab() {
  const { shipments } = getState();
  if (!shipments.length) return emptyState({ iconName: 'truck', title: 'Aucune livraison', text: 'Les demandes des joueurs apparaîtront ici.' });
  return `
  <section class="panel panel--pad">
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Demande</th><th>Cartes à sortir du coffre</th><th>Destinataire</th><th class="num">Frais</th><th>État</th><th>Suivi</th></tr></thead>
      <tbody>
        ${shipments
          .map((s) => {
            const cards = s.uids.map(ownedByUid).filter(Boolean).map((o) => cardById(o.cardId)).filter(Boolean);
            const a = s.address;
            return `<tr data-ship="${esc(s.id)}">
              <td class="nowrap muted">${dateTimeFr(s.at)}</td>
              <td>${cards.map((c) => `${esc(c.name)} <span class="muted small">${esc(cardRef(c))}</span>`).join('<br>')}</td>
              <td class="small">${esc(a.name)}<br><span class="muted">${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ''}, ${esc(a.zip)} ${esc(a.city)}</span></td>
              <td class="num">${eur(s.fee)}</td>
              <td><select class="input input--sm" data-ship-status aria-label="État de la livraison">${Object.entries(SHIP_STATUS).map(([k, label]) => `<option value="${k}" ${s.status === k ? 'selected' : ''}>${label}</option>`).join('')}</select></td>
              <td><input class="input input--sm" data-ship-tracking placeholder="N° de suivi" value="${esc(s.tracking || '')}" aria-label="Numéro de suivi"></td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table></div>
  </section>`;
}

/* ------------------------------------------------------------ mouvements */

const TX = { depot: 'Dépôt', bonus: 'Bonus', cashback: 'Cashback', achat: 'Vente de packs', rachat: 'Rachat', livraison: 'Frais de livraison' };

function movementsTab() {
  const { tx, user } = getState();
  if (!user) return emptyState({ iconName: 'receipt', title: 'Aucun compte joueur', text: "Les mouvements du compte créé sur cet appareil s'afficheront ici." });
  const l = houseLedger();
  return `
  <div class="stats stats--4">
    ${statTile({ iconName: 'package', label: 'Packs vendus', value: eur(l.sales) })}
    ${statTile({ iconName: 'hand-coins', label: 'Rachats versés', value: eur(l.buybacks) })}
    ${statTile({ iconName: 'percent', label: 'Marge théorique', value: eur(l.theo), hint: 'sur les mises' })}
    ${statTile({ iconName: 'archive', label: 'Cartes dues', value: eur(l.vault + l.shipped), hint: 'au nom du joueur, en cote' })}
  </div>
  <section class="panel panel--pad">
    ${
      tx.length
        ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Date</th><th>Joueur</th><th>Opération</th><th>Détail</th><th class="num">Montant</th></tr></thead>
            <tbody>${tx
              .slice(0, 200)
              .map((t) => `<tr><td class="nowrap muted">${dateTimeFr(t.at)}</td><td>${esc(user.pseudo)}</td><td>${TX[t.type] || esc(t.type)}</td><td>${esc(t.label)}</td><td class="num ${t.amount >= 0 ? 'pos' : 'neg'}">${t.amount >= 0 ? '+' : '−'}${eur(Math.abs(t.amount))}</td></tr>`)
              .join('')}</tbody>
          </table></div>`
        : `<p class="muted">Aucun mouvement.</p>`
    }
    <p class="small muted">Montants vus du joueur : un achat de pack est une entrée pour le site, un rachat une sortie.</p>
  </section>`;
}

/* -------------------------------------------------------------- la page */

const body = (tab) => ({ apercu: overview, stock: stockTab, packs: packsTab, livraisons: shipmentsTab, mouvements: movementsTab, pilotage: () => pilotage.render() })[tab]();

export default {
  title: 'Espace admin',
  render({ params }) {
    if (!isAdmin()) return gate();
    const tab = TABS.some(([key]) => key === params.tab) ? params.tab : 'apercu';
    return `
    ${pageHead({ icon: 'key-round', title: 'Espace admin', lead: `Connecté : ${esc(adminUser())}`, actions: `<button class="btn btn--secondary btn--sm" type="button" data-admin-logout>${icon('log-out', { size: 15 })}Quitter</button>` })}
    <nav class="tabs" aria-label="Tableaux">
      ${TABS.map(([key, label, ico]) => `<a class="tab ${tab === key ? 'is-active' : ''}" href="#/admin/${key}" ${tab === key ? 'aria-current="page"' : ''}>${icon(ico, { size: 16 })}${label}</a>`).join('')}
    </nav>
    <div class="stack" data-admin-body>${body(tab)}</div>`;
  },

  mount(root, ctx) {
    const { params, rerender, navigate } = ctx;

    if (!isAdmin()) {
      const form = root.querySelector('[data-admin-auth]');
      const error = root.querySelector('[data-error]');
      const onSubmit = (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        let res;
        if (adminConfigured()) res = loginAdmin(data.user, data.password);
        else if (data.password !== data.confirm) res = { ok: false, message: 'Les deux mots de passe ne sont pas identiques.' };
        else res = setupAdmin(data.user, data.password);
        if (!res.ok) {
          error.textContent = res.message;
          error.hidden = false;
          return;
        }
        rerender();
      };
      form.addEventListener('submit', onSubmit);
      return () => form.removeEventListener('submit', onSubmit);
    }

    const tab = TABS.some(([key]) => key === params.tab) ? params.tab : 'apercu';
    const cleanups = [];
    const on = (type, fn) => {
      root.addEventListener(type, fn);
      cleanups.push(() => root.removeEventListener(type, fn));
    };

    on('click', (e) => {
      if (!e.target.closest('[data-admin-logout]')) return;
      logoutAdmin();
      navigate('/');
    });

    if (tab === 'pilotage') cleanups.push(pilotage.mount(root, ctx) || (() => {}));

    if (tab === 'livraisons') {
      on('change', (e) => {
        const row = e.target.closest('[data-ship]');
        if (!row) return;
        updateShipment(row.dataset.ship, { status: row.querySelector('[data-ship-status]').value, tracking: row.querySelector('[data-ship-tracking]').value });
        toast('Livraison mise à jour.', 'success');
      });
    }

    if (tab === 'stock') {
      const tableEl = () => root.querySelector('[data-stock-table]');
      const paint = () => {
        const el = tableEl();
        if (!el) return;
        el.innerHTML = stockTable();
        root.querySelector('[data-stock-summary]').innerHTML = stockSummary();
      };
      const cardOf = (id) => ui.cat?.cards.find((c) => c.id === id);
      /** Repeint en gardant le focus sur la commande qu'on vient d'utiliser. */
      const repaint = (id, selector) => {
        paint();
        if (id) tableEl().querySelector(`tr[data-id="${CSS.escape(id)}"] ${selector}`)?.focus();
      };

      if (!ui.cat && !ui.error) {
        let alive = true;
        cleanups.push(() => (alive = false));
        loadCatalogue()
          .then((cat) => {
            ui.cat = cat;
            // Le filtre des extensions dépend du catalogue : on redessine l'onglet entier.
            if (alive) rerender();
          })
          .catch((err) => {
            // Catalogue indisponible : on travaille au moins sur les cartes connues du site.
            const cards = stockCards().map((c) => ({ ...c, kind: 0, dex: 0, q: fold(`${c.name} ${c.nameEn} ${c.set} ${c.code} ${c.number}`) }));
            ui.cat = { date: '', sets: [], cards };
            ui.error = err.message;
            if (alive) rerender();
          });
      }

      let timer = 0;
      cleanups.push(() => clearTimeout(timer));
      on('input', (e) => {
        const f = e.target.closest('[data-f]');
        if (!f || f.tagName === 'SELECT') return;
        ui[f.dataset.f] = f.value;
        ui.page = 0;
        clearTimeout(timer);
        timer = setTimeout(paint, 160);
      });
      on('change', async (e) => {
        const f = e.target.closest('select[data-f]');
        if (f) {
          ui[f.dataset.f] = f.value;
          ui.page = 0;
          paint();
          return;
        }
        const row = e.target.closest('tr[data-id]');
        if (row) {
          const card = cardOf(row.dataset.id);
          if (!card) return;
          if (e.target.matches('[data-toggle]')) {
            setStock(card.id, e.target.checked ? Math.max(1, qtyOf(card.id)) : 0, cardRecord(card));
            repaint(card.id, '[data-toggle]');
          } else if (e.target.matches('[data-price]')) {
            const cents = Math.round((Number.parseFloat(e.target.value) || 0) * 100);
            setPrice(card.id, cents > 0 && cents !== card.value ? cents : null);
            repaint(card.id, '[data-price]');
          }
          return;
        }
        const file = e.target.closest('[data-import]')?.files?.[0];
        if (file) {
          try {
            const n = importStock(JSON.parse(await file.text()));
            toast(`Inventaire importé : ${plural(n, 'référence', 'références')} au coffre.`, 'success');
          } catch (err) {
            toast(err instanceof SyntaxError ? "Ce fichier n'est pas un fichier JSON valide." : err.message, 'error');
          }
          rerender();
        }
      });
      on('click', async (e) => {
        const row = e.target.closest('tr[data-id]');
        const step = e.target.closest('[data-inc], [data-dec]');
        if (row && step) {
          const card = cardOf(row.dataset.id);
          if (!card) return;
          const up = step.matches('[data-inc]');
          setStock(card.id, qtyOf(card.id) + (up ? 1 : -1), cardRecord(card));
          repaint(card.id, up ? '[data-inc]' : qtyOf(card.id) ? '[data-dec]' : '[data-inc]');
          return;
        }
        const page = e.target.closest('[data-page]');
        if (page) {
          ui.page = Math.max(0, ui.page + Number(page.dataset.page));
          paint();
          tableEl().scrollIntoView({ block: 'start' });
          return;
        }
        const bulk = e.target.closest('[data-bulk]');
        if (bulk) {
          const list = filtered();
          const into = bulk.dataset.bulk === 'in';
          const ok = await confirmDialog({
            title: into ? 'Mettre au coffre ?' : 'Retirer du coffre ?',
            confirm: into ? 'Mettre au coffre' : 'Retirer',
            body: `<p>${plural(list.length, 'carte', 'cartes')} correspondent aux filtres en cours.</p><p class="muted small">${into ? 'Chacune aura au moins un exemplaire au coffre.' : 'Elles ne pourront plus sortir des packs.'}</p>`,
          });
          if (!ok) return;
          setStockMany(list.map((card) => ({ id: card.id, qty: into ? Math.max(1, qtyOf(card.id)) : 0, card: cardRecord(card) })));
          paint();
          return;
        }
        if (e.target.closest('[data-export]')) {
          const data = exportStock();
          const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
          const a = Object.assign(document.createElement('a'), { href: url, download: `stock-${data.date}.json` });
          document.body.append(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }
        if (e.target.closest('[data-clear]')) {
          const ok = await confirmDialog({ title: 'Vider le coffre ?', confirm: 'Vider', body: `<p>Plus aucune carte ne sera au coffre : tous les packs passeront en rupture jusqu'à ce que tu saisisses ton inventaire.</p>` });
          if (!ok) return;
          clearStock();
          paint();
          return;
        }
        if (e.target.closest('[data-reset]')) {
          const ok = await confirmDialog({ title: 'Revenir au stock de départ ?', confirm: 'Revenir', body: `<p>L'inventaire saisi sur cet appareil sera remplacé par le stock livré avec le site.</p>` });
          if (!ok) return;
          resetStock();
          // Les cartes que le joueur de cet appareil détient déjà ne redeviennent pas disponibles.
          holdBackOwnedCards();
          paint();
        }
      });
    }

    return () => cleanups.forEach((fn) => fn());
  },
};
