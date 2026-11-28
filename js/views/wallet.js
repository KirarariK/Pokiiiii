// Solde : recharge, part retirable, bonus à jouer et historique des mouvements.

import { RULES } from '../config.js';
import { dateTimeFr, esc, eur } from '../format.js';
import { icon } from '../icons.js';
import { bonusStatus, getState, spentToday, subscribe, withdrawable } from '../store.js';
import { emptyState, note, pageHead, statTile } from '../ui/blocks.js';
import { openModal } from '../ui/modal.js';

const TYPES = {
  depot: { label: 'Recharge', icon: 'arrow-down-left' },
  bonus: { label: 'Bonus', icon: 'gift' },
  cashback: { label: 'Cashback', icon: 'hand-coins' },
  achat: { label: 'Achat de packs', icon: 'package' },
  rachat: { label: 'Revente', icon: 'hand-coins' },
  livraison: { label: 'Livraison', icon: 'truck' },
};

function openWithdraw() {
  const bonus = bonusStatus();
  openModal({
    title: 'Retirer mon solde',
    size: 'sm',
    body: `
      <p>Montant retirable aujourd'hui : <strong>${eur(withdrawable())}</strong>.</p>
      ${bonus.active ? `<p class="muted">${eur(bonus.balance)} de fonds de bonus restent en jeu : encore ${eur(bonus.wagerLeft)} de mises avant qu'ils rejoignent le reste de ton solde.</p>` : ''}
      ${note('Aucun retrait : le solde est fait de crédits fictifs, il ne représente pas de l\'argent.', 'demo')}
      <p class="muted small">Un solde en euros rechargé puis retiré ne peut être tenu que par un établissement agréé : la démonstration montre le parcours, pas un service de paiement.</p>`,
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
    const bonus = bonusStatus();
    return `
    ${pageHead({ icon: 'wallet', title: 'Mon solde' })}

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

    <div class="stats stats--4">
      ${statTile({ iconName: 'landmark', label: 'Retirable', value: eur(withdrawable()), hint: bonus.active ? 'tes crédits, hors bonus en jeu' : 'tout ton solde' })}
      ${statTile({ iconName: 'gift', label: 'Bonus en jeu', value: eur(bonus.balance), hint: bonus.active ? `encore ${eur(bonus.wagerLeft)} de mises (${Math.floor(bonus.progress * 100)}\u00a0% fait)` : 'aucun bonus en cours' })}
      ${statTile({ iconName: 'calendar', label: "Dépensé aujourd'hui", value: eur(today), hint: limits.daily != null ? `limite : ${eur(limits.daily)}` : 'aucune limite fixée' })}
      ${statTile({ iconName: 'shield', label: 'Limite quotidienne', value: limits.daily != null ? eur(limits.daily) : '—', hint: '<a href="#/parametres">Régler ma limite</a>' })}
    </div>

    ${bonus.active ? note(`Tes achats sont payés avec ton argent d'abord, avec le bonus ensuite. Le bonus, et ce qu'il t'a rapporté, rejoignent le reste de ton solde une fois que tu as misé ${RULES.bonus.wagering} fois son montant en packs. Un bonus ne bloque jamais tes autres crédits.`, 'info') : ''}

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('receipt', { size: 22 })}<span>Mouvements</span></h2></div>
      ${
        tx.length
          ? `<div class="table-wrap"><table class="table table--stack table--tx">
              <thead><tr><th>Date</th><th>Opération</th><th>Détail</th><th class="num">Montant</th></tr></thead>
              <tbody>
                ${tx
                  .slice(0, 100)
                  .map((t) => {
                    const type = TYPES[t.type] || { label: t.type, icon: 'receipt' };
                    return `<tr>
                      <td class="nowrap muted" data-label="Date">${dateTimeFr(t.at)}</td>
                      <td data-label="Opération"><span class="tx-type">${icon(type.icon, { size: 16 })}${esc(type.label)}</span></td>
                      <td data-label="Détail">${esc(t.label)}</td>
                      <td data-label="Montant" class="num ${t.amount >= 0 ? 'pos' : 'neg'}">${t.amount >= 0 ? '+' : '−'}${eur(Math.abs(t.amount))}</td>
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
