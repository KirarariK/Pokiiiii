// Solde : recharge, retrait et historique des mouvements.

import { RULES } from '../config.js';
import { dateTimeFr, esc, eur } from '../format.js';
import { icon } from '../icons.js';
import { getState, spentToday, subscribe } from '../store.js';
import { emptyState, note, pageHead, statTile } from '../ui/blocks.js';
import { openModal } from '../ui/modal.js';

const TYPES = {
  depot: { label: 'Recharge', icon: 'arrow-down-left' },
  bonus: { label: 'Bonus', icon: 'gift' },
  achat: { label: 'Achat de packs', icon: 'package' },
  rachat: { label: 'Revente', icon: 'hand-coins' },
  livraison: { label: 'Livraison', icon: 'truck' },
};

function openWithdraw() {
  openModal({
    title: 'Retirer mon solde',
    size: 'sm',
    body: `
      <p>En production, l'avoir issu de tes reventes pourra être versé par virement bancaire :</p>
      <ul class="list">
        <li>${icon('scan-face', { size: 16 })}après vérification d'identité (KYC)</li>
        <li>${icon('banknote', { size: 16 })}à partir de ${eur(RULES.withdrawal.minimum)}</li>
        <li>${icon('clock', { size: 16 })}sous ${RULES.withdrawal.delay}, sans frais</li>
      </ul>
      ${note('Le retrait est désactivé en démonstration : le solde est fictif.', 'demo')}`,
    footer: `<button class="btn btn--primary" type="button" data-close>Compris</button>`,
  });
}

export default {
  nav: 'solde',
  title: 'Mon solde',
  auth: true,
  render() {
    const { balance, tx, limits } = getState();
    const today = spentToday();
    return `
    ${pageHead({ icon: 'wallet', title: 'Mon solde', lead: 'Recharge ton solde pour acheter des packs ; tes reventes y sont créditées.' })}

    <section class="panel wallet">
      <div>
        <span class="muted">Solde disponible</span>
        <strong class="wallet__amount">${eur(balance)}</strong>
        <span class="simulated">${icon('info', { size: 14 })}Crédits fictifs</span>
      </div>
      <div class="wallet__actions">
        <button class="btn btn--primary btn--lg" type="button" data-action="topup">${icon('plus', { size: 18 })}Recharger</button>
        <button class="btn btn--secondary btn--lg" type="button" data-withdraw>${icon('landmark', { size: 18 })}Retirer</button>
      </div>
    </section>

    <div class="stats stats--2">
      ${statTile({ iconName: 'calendar', label: "Dépensé aujourd'hui", value: eur(today), hint: limits.daily != null ? `limite : ${eur(limits.daily)}` : 'aucune limite fixée' })}
      ${statTile({ iconName: 'shield', label: 'Limite quotidienne', value: limits.daily != null ? eur(limits.daily) : '—', hint: '<a href="#/parametres">Régler ma limite</a>' })}
    </div>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('receipt', { size: 22 })}<span>Mouvements</span></h2></div>
      ${
        tx.length
          ? `<div class="table-wrap"><table class="table">
              <thead><tr><th>Date</th><th>Opération</th><th>Détail</th><th class="num">Montant</th></tr></thead>
              <tbody>
                ${tx
                  .slice(0, 100)
                  .map((t) => {
                    const type = TYPES[t.type] || { label: t.type, icon: 'receipt' };
                    return `<tr>
                      <td class="nowrap muted">${dateTimeFr(t.at)}</td>
                      <td><span class="tx-type">${icon(type.icon, { size: 16 })}${type.label}</span></td>
                      <td>${esc(t.label)}</td>
                      <td class="num ${t.amount >= 0 ? 'pos' : 'neg'}">${t.amount >= 0 ? '+' : '−'}${eur(Math.abs(t.amount))}</td>
                    </tr>`;
                  })
                  .join('')}
              </tbody>
            </table></div>`
          : emptyState({ iconName: 'receipt', title: 'Aucun mouvement', text: 'Tes recharges, achats et reventes apparaîtront ici.' })
      }
    </section>`;
  },
  mount(root, { rerender }) {
    const onClick = (e) => {
      if (e.target.closest('[data-withdraw]')) openWithdraw();
    };
    // La recharge passe par l'action globale « topup » : on redessine la page quand le solde change.
    let last = getState().balance;
    const unsubscribe = subscribe((state) => {
      if (state.balance === last) return;
      last = state.balance;
      rerender();
    });
    root.addEventListener('click', onClick);
    return () => {
      unsubscribe();
      root.removeEventListener('click', onClick);
    };
  },
};
