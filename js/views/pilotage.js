// Pilotage : la vue du gérant. Compte de résultat d'un mois selon les hypothèses,
// leviers, résultat par pack, coût de chaque fonctionnalité, et le compte vu du site.
// Affichée dans l'espace admin (js/views/admin.js).

import { RULES } from '../config.js';
import { packAvailable, packReturn } from '../catalog.js';
import { BADGES } from '../data/badges.js';
import { listGiveaways } from '../data/giveaways.js';
import { PACKS } from '../data/packs.js';
import { AVERAGE_FIRST_DEPOSIT, averageBonus, blendedEdge, DEFAULTS, expectedMonth, levers, packEconomics, SALES_MIX, simulateMonths, VAT_REGIMES } from '../economics.js';
import { esc, eur, eurShort, num, pct } from '../format.js';
import { icon } from '../icons.js';
import { houseLedger, isLoggedIn } from '../store.js';

const percent = (x, digits = 1) => `${x < 0 ? '−' : ''}${(Math.abs(x) * 100).toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
/** Montant arrondi à l'euro, avec un vrai signe moins. */
const euros = (cents) => `${cents < 0 ? '−' : ''}${eurShort(Math.round(Math.abs(cents) / 100) * 100)}`;
const points = (x) => (Math.abs(x) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/** Hypothèses en cours, conservées tant qu'on reste sur la page. */
const h = { ...DEFAULTS };

/**
 * Curseurs. `unit` convertit la valeur du curseur en valeur du modèle (les
 * frais fixes se règlent en euros, le modèle compte en centimes).
 */
const SLIDERS = [
  { key: 'packs', label: 'Packs vendus par mois', min: 200, max: 30000, step: 100, show: (v) => num(v) },
  { key: 'newPer100', label: 'Nouveaux déposants pour 100 packs', min: 0, max: 20, step: 0.5, show: (v) => v.toLocaleString('fr-FR') },
  { key: 'fixed', label: 'Frais fixes du mois', min: 0, max: 40000, step: 500, unit: 100, show: (v) => eurShort(v) },
  { key: 'rtpShift', label: 'Écart de retour des packs', min: -0.03, max: 0.03, step: 0.005, show: (v) => (Math.abs(v) < 1e-9 ? 'aucun' : `${v > 0 ? '−' : '+'}${points(v)} pt`) },
  { key: 'instant', label: 'Cartes revendues pendant la garantie', min: 0, max: 1, step: 0.01, show: (v) => percent(v, 0) },
  { key: 'later', label: 'Cartes revendues plus tard', min: 0, max: 1, step: 0.01, show: (v) => percent(v, 0) },
  { key: 'cost', label: "Prix d'achat des cartes (part de la cote)", min: 0.5, max: 1, step: 0.01, show: (v) => percent(v, 0) },
  { key: 'cashbackRate', label: 'Cashback moyen (part de la marge)', min: 0.04, max: 0.12, step: 0.005, show: (v) => percent(v, 1) },
  { key: 'fees', label: 'Frais de paiement et fraude (part des dépôts)', min: 0, max: 0.06, step: 0.005, show: (v) => percent(v, 1) },
];

function controls() {
  return `<div class="sim__controls">
    ${SLIDERS.map((s) => {
      const unit = s.unit || 1;
      return `<label class="sim__control"><span>${s.label}<output data-out="${s.key}">${s.show(h[s.key])}</output></span>
        <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${h[s.key] / unit}" data-sim="${s.key}"></label>`;
    }).join('')}
    <label class="sim__control"><span>Régime de TVA<small class="muted">à faire valider : le résultat en dépend</small></span>
      <select class="input input--sm" data-sim-vat aria-label="Régime de TVA">${VAT_REGIMES.map(([v, label]) => `<option value="${v}" ${Number(h.vat) === v ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
  </div>`;
}

function histogram(results) {
  const bins = 24;
  const min = results[0];
  const max = results[results.length - 1];
  const span = max - min || 1;
  const counts = new Array(bins).fill(0);
  results.forEach((x) => counts[Math.min(bins - 1, Math.floor(((x - min) / span) * bins))]++);
  const peak = Math.max(...counts);
  return `<div>
    <div class="histo" role="img" aria-label="Répartition du résultat mensuel simulé, de ${euros(min)} à ${euros(max)}">
      ${counts.map((c, i) => `<i class="${min + ((i + 0.5) / bins) * span < 0 ? 'is-neg' : ''}" style="height:${Math.max(3, Math.round((c / peak) * 100))}%"></i>`).join('')}
    </div>
    <p class="histo__axis"><span>${euros(min)}</span><span>résultat d'un mois, sur ${results.length} mois simulés</span><span>${euros(max)}</span></p>
  </div>`;
}

/** Du chiffre d'affaires au résultat, ligne par ligne. */
function statement(m) {
  const share = (x) => (m.revenue ? percent(x / m.revenue) : '—');
  const line = (label, amount, hint = '') => `<tr><th scope="row">${label}${hint ? `<small>${hint}</small>` : ''}</th><td class="num">${euros(-amount)}</td><td class="num muted">${share(amount)}</td></tr>`;
  const total = (label, amount, hint = '') =>
    `<tr class="is-total"><th scope="row">${label}${hint ? `<small>${hint}</small>` : ''}</th><td class="num"><strong class="${amount >= 0 ? 'pos' : 'neg'}">${euros(amount)}</strong></td><td class="num">${share(amount)}</td></tr>`;
  return `<div class="table-wrap"><table class="table table--pl">
    <thead><tr><th>Poste</th><th class="num">Montant</th><th class="num">% des ventes</th></tr></thead>
    <tbody>
      <tr><th scope="row">Ventes de packs</th><td class="num">${euros(m.revenue)}</td><td class="num muted">100 %</td></tr>
      ${line('Coût des cartes', m.cards, 'rachats versés et cartes sorties du stock')}
      ${total('Marge de jeu', m.gross)}
      ${line('Cashback', m.cashback)}
      ${line('Dotation du classement', m.leaderboard)}
      ${line('Cagnotte des giveaways', m.giveaway)}
      ${line('Bonus de premier dépôt', m.bonus, `${eurShort(Math.round(averageBonus()))} par nouveau déposant`)}
      ${total('Marge après fidélité', m.afterLoyalty)}
      ${line('Frais de paiement et fraude', m.fees)}
      ${line('TVA', m.vat, (VAT_REGIMES.find(([v]) => v === Number(h.vat)) || VAT_REGIMES[0])[1].toLowerCase())}
      ${total('Résultat avant frais fixes', m.contribution)}
      ${line('Frais fixes', m.fixed, 'équipe, coffre, assurance, outils, publicité')}
      ${total('Résultat du mois', m.result, "avant impôt sur les sociétés")}
    </tbody>
  </table></div>
  <div class="table-wrap"><table class="table table--pl">
    <caption class="muted small">Le même mois selon le régime de TVA. Le régime applicable n'est pas tranché : seul le premier rend le modèle confortable.</caption>
    <thead><tr><th>Régime de TVA</th><th class="num">TVA</th><th class="num">Résultat du mois</th></tr></thead>
    <tbody>${VAT_REGIMES.filter(([v]) => v).map(([v, label]) => {
      const x = expectedMonth({ ...h, vat: v });
      return `<tr${v === Number(h.vat) ? ' class="is-total"' : ''}><th scope="row">${label}</th><td class="num">${euros(-x.vat)}</td><td class="num"><strong class="${x.result >= 0 ? 'pos' : 'neg'}">${euros(x.result)}</strong></td></tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function simulation() {
  const keptShare = Math.max(0, 1 - h.instant - h.later);
  const runs = Math.max(40, Math.min(300, Math.floor(1_200_000 / h.packs)));
  const m = expectedMonth(h);
  const sim = simulateMonths(h, { runs });
  const tile = (label, value, hint = '', cls = '') => `<div class="stat"><span class="stat__label">${label}</span><strong class="stat__value ${cls}">${value}</strong>${hint ? `<span class="stat__hint">${hint}</span>` : ''}</div>`;
  const reachable = Number.isFinite(m.breakEven);
  return `
    <div class="stats stats--4">
      ${tile('Ventes de packs', euros(m.revenue), 'par mois')}
      ${tile('Résultat du mois', euros(m.result), `${percent(m.rate)} des ventes, après frais fixes`, m.result >= 0 ? 'pos' : 'neg')}
      ${tile('Seuil de rentabilité', reachable ? num(m.breakEven) : 'aucun', reachable ? 'packs par mois, pour couvrir les frais fixes' : 'chaque pack vendu coûte plus qu’il ne rapporte', reachable && m.breakEven <= h.packs ? '' : 'neg')}
      ${tile('Risque de mois déficitaire', percent(sim.lossRisk, 1), `1 mois sur 20 finit sous ${euros(sim.low)}`, sim.lossRisk > 0.05 ? 'neg' : '')}
    </div>
    ${statement(m)}
    ${histogram(sim.results)}
    <p class="small muted">Cartes gardées ou livrées : ${percent(keptShare, 0)}. Chaque mois est simulé carte par carte avec les tables de tirage réelles : la dispersion vient des gros lots, et elle pèse d'autant plus que le volume est faible.</p>`;
}

function leverList() {
  const rows = levers(h);
  const top = Math.max(...rows.map((l) => Math.abs(l.gain)), 1);
  return `<ol class="levers">
    ${rows
      .map(
        (l) => `<li class="lever"><span class="lever__label">${l.label}</span>
          <span class="lever__bar"><i class="${l.gain < 0 ? 'is-neg' : ''}" style="width:${Math.max(2, Math.round((Math.abs(l.gain) / top) * 100))}%"></i></span>
          <strong class="lever__gain ${l.gain >= 0 ? 'pos' : 'neg'}">${l.gain >= 0 ? '+' : ''}${euros(l.gain)}</strong></li>`,
      )
      .join('')}
  </ol>`;
}

function packTable() {
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th>Pack</th><th class="num">Prix</th><th class="num">Part des ventes</th><th class="num">Retour affiché</th><th class="num">Marge de jeu</th><th class="num">Résultat par pack</th></tr></thead>
    <tbody>
      ${PACKS.map((pack) => {
        if (!packAvailable(pack)) return `<tr><th scope="row" class="nowrap"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th><td class="num">${eur(pack.price)}</td><td class="muted" colspan="4">En rupture : le coffre ne permet pas de le composer</td></tr>`;
        const e = packEconomics(pack, h);
        return `<tr>
          <th scope="row" class="nowrap"><a href="#/packs/${pack.slug}">${esc(pack.name)}</a></th>
          <td class="num">${eur(pack.price)}</td>
          <td class="num">${percent(SALES_MIX[pack.slug] || 0, 1)}</td>
          <td class="num">${percent(packReturn(pack) - h.rtpShift)}</td>
          <td class="num">${percent(e.grossRate)}</td>
          <td class="num"><strong class="${e.net >= 0 ? 'pos' : 'neg'}">${e.net < 0 ? '−' : ''}${eur(Math.abs(Math.round(e.net)))}</strong> <span class="muted">(${percent(e.rate)})</span></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

function ledger() {
  if (!isLoggedIn()) return `<p class="muted">Connecte-toi et joue quelques packs : ton compte apparaîtra ici tel que le site le voit.</p>`;
  const l = houseLedger();
  const row = (label, value, hint = '') => `<div><dt>${label}${hint ? ` <span class="muted">· ${hint}</span>` : ''}</dt><dd>${value}</dd></div>`;
  return `<dl class="kv">
    ${row('Packs vendus à ce joueur', eur(l.sales))}
    ${row('Rachats versés', `− ${eur(l.buybacks)}`)}
    ${row('Cashback versé', `− ${eur(l.cashback)}`)}
    ${row('Résultat de caisse', `<strong class="${l.cash >= 0 ? 'pos' : 'neg'}">${l.cash < 0 ? '−' : ''}${eur(Math.abs(l.cash))}</strong>`, 'avant les cartes encore dues')}
    ${row('Marge théorique sur ses mises', eur(l.theo), 'ce que le site devait gagner en moyenne')}
    ${row('Cartes encore dues au joueur', eur(l.vault + l.shipped), 'au coffre ou en livraison, en cote')}
    ${row('Cotes misées en Évolution', eur(l.staked))}
    ${row('Bonus offerts', eur(l.bonuses), l.bonusLeft ? `dont ${eur(l.bonusLeft)} encore en jeu, non retirables` : 'joués ou perdus')}
    ${row('Frais de livraison encaissés', eur(l.shippingFees))}
  </dl>`;
}

export default {
  title: 'Pilotage',
  render() {
    const fund = listGiveaways().find((g) => g.fundRate)?.fundRate ?? 0;
    const { edgeMin, edgeMax } = RULES.evolution;
    const { wagering, firstDepositRate, firstDepositMax } = RULES.bonus;
    const edge = blendedEdge();
    const { from, rate } = RULES.shippingInsurance;
    return `
    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('sliders-horizontal', { size: 22 })}<span>Hypothèses</span></h2><button class="btn btn--ghost btn--sm" type="button" data-reset-sim>${icon('rotate-ccw', { size: 15 })}Valeurs par défaut</button></div>
      ${controls()}
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('activity', { size: 22 })}<span>Un mois d'activité</span></h2></div>
      <div class="stack" data-sim-out>${simulation()}</div>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('chevrons-up', { size: 22 })}<span>Les leviers</span></h2></div>
      <p class="muted small">Ce que chaque mouvement change au résultat du mois, toutes choses égales par ailleurs. Baisser le retour ou le cashback rapporte tout de suite, mais se voit : le retour est affiché sur chaque pack, et un joueur qui s'en va ne rapporte plus rien.</p>
      <div data-levers>${leverList()}</div>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('package', { size: 22 })}<span>Résultat par pack</span></h2></div>
      <p class="muted small">Marge de jeu = prix − coût de la carte. Une carte revendue coûte ${percent(RULES.buybackRate, 0)} ou ${percent(RULES.buybackLaterRate, 0)} de sa cote et retourne en stock ; une carte gardée ou livrée coûte son prix d'achat. Le résultat retire ensuite cashback, classement, giveaway, frais de paiement et TVA.</p>
      <div data-pack-table>${packTable()}</div>
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('percent', { size: 22 })}Ce que rapporte ou coûte chaque fonctionnalité</h2>
      <ul>
        <li><strong>Packs</strong> : ${percent(edge)} de marge affichée en moyenne. Un joueur qui revend coûte au site le retour affiché, ni plus ni moins ; un joueur qui garde sa carte coûte son prix d'achat, donc moins dès que le site achète sous ${percent(RULES.buybackRate, 0)} de la cote.</li>
        <li><strong>Rachat</strong> : ${percent(RULES.buybackRate, 0)} pendant ${RULES.buybackLockMinutes} minutes, ${percent(RULES.buybackLaterRate, 0)} ensuite. L'écart paie le risque de cote, la garde et l'assurance d'une carte qui dort au coffre.</li>
        <li><strong>Évolution</strong> : marge de ${percent(edgeMin, 0)} à ${percent(edgeMax, 0)} de la cote misée, croissante avec le multiplicateur. Aucun mouvement d'argent : le site doit moins de cartes qu'avant.</li>
        <li><strong>Cashback</strong> : ${pct(BADGES[0].cashback * 100)} à ${pct(BADGES[BADGES.length - 1].cashback * 100)} de la marge théorique. Plafonné par construction : il ne peut pas dépasser ce que le joueur rapporte.</li>
        <li><strong>Bonus de premier dépôt</strong> : ${percent(firstDepositRate, 0)} du dépôt, ${eurShort(firstDepositMax)} au plus, à jouer ${wagering} fois. À ${percent(edge)} de marge, le joueur en reperd en moyenne ${percent(wagering * edge, 0)} en le jouant : le bonus se rembourse par le jeu qu'il déclenche. Le compte ci-dessus le retient quand même en entier, pour un premier dépôt moyen de ${eurShort(AVERAGE_FIRST_DEPOSIT)}.</li>
        <li><strong>Giveaway</strong> : ${pct(fund * 100)} du prix de chaque pack événement, financés par ses points de marge en plus. Les lots ne se débloquent qu'à mesure des ventes : jamais de lot non financé.</li>
        <li><strong>Classement</strong> : ${pct(RULES.leaderboardShare * 100)} de la marge du mois pour les dix premiers. Seuls les achats de packs donnent des points.</li>
        <li><strong>Livraison</strong> : facturée au joueur, avec ${pct(rate * 100)} d'assurance sur la cote expédiée au-delà de ${eurShort(from)}. Elle ne doit ni rapporter ni coûter.</li>
      </ul>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('receipt', { size: 22 })}<span>Ce compte, vu du site</span></h2></div>
      ${ledger()}
    </section>

    <section class="panel panel--pad prose">
      <h2>${icon('shield-check', { size: 22 })}Ce que le site s'interdit</h2>
      <p>Chaque point ci-dessous rapporterait à court terme. Tous exposent à une sanction, à des impayés ou à la perte d'un agrément, et aucun n'est nécessaire pour que le modèle soit rentable.</p>
      <ul>
        <li>Fabriquer des « presque-victoires » sur la roulette, ou présenter une perte comme un gain.</li>
        <li>Cacher une probabilité, un retour théorique ou une condition de bonus.</li>
        <li>Afficher de faux gagnants, de faux compteurs ou de fausses urgences.</li>
        <li>Bloquer l'argent déposé derrière un bonus : seul le bonus est soumis à condition.</li>
        <li>Relancer un joueur en pause, ou lui laisser lever sa pause.</li>
        <li>Rendre un retrait plus difficile qu'un dépôt.</li>
        <li>Accepter un joueur sans avoir vérifié son âge.</li>
      </ul>
      <p class="small muted">Le détail de chaque réglage et de ses raisons est dans <code>docs/GERANT.md</code>.</p>
    </section>`;
  },
  mount(root) {
    let timer = 0;
    const refresh = () => {
      root.querySelector('[data-sim-out]').innerHTML = simulation();
      root.querySelector('[data-levers]').innerHTML = leverList();
      root.querySelector('[data-pack-table]').innerHTML = packTable();
    };
    const paintControls = () => {
      SLIDERS.forEach((s) => {
        root.querySelector(`[data-sim="${s.key}"]`).value = h[s.key] / (s.unit || 1);
        root.querySelector(`[data-out="${s.key}"]`).textContent = s.show(h[s.key]);
      });
      root.querySelector('[data-sim-vat]').value = String(Number(h.vat));
    };
    const onInput = (e) => {
      if (e.target.closest('[data-sim-vat]')) h.vat = Number(e.target.value);
      else {
        const input = e.target.closest('[data-sim]');
        if (!input) return;
        const key = input.dataset.sim;
        const slider = SLIDERS.find((s) => s.key === key);
        h[key] = Number(input.value) * (slider.unit || 1);
        // Les deux parts de revente ne peuvent pas dépasser 100 % à elles deux.
        if (key === 'instant') h.later = Math.min(h.later, Math.round((1 - h.instant) * 100) / 100);
        if (key === 'later') h.instant = Math.min(h.instant, Math.round((1 - h.later) * 100) / 100);
      }
      paintControls();
      clearTimeout(timer);
      timer = setTimeout(refresh, 140);
    };
    const onClick = (e) => {
      if (!e.target.closest('[data-reset-sim]')) return;
      Object.assign(h, DEFAULTS);
      paintControls();
      refresh();
    };
    root.addEventListener('input', onInput);
    root.addEventListener('click', onClick);
    return () => {
      clearTimeout(timer);
      root.removeEventListener('input', onInput);
      root.removeEventListener('click', onClick);
    };
  },
};
