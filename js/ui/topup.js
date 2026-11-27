// Fenêtre de recharge du solde (crédits fictifs en démonstration).

import { RULES } from '../config.js';
import { eur, eurShort } from '../format.js';
import { icon } from '../icons.js';
import { deposit, getState, isFirstDeposit, isLoggedIn } from '../store.js';
import { sfx } from './effects.js';
import { openModal, toast } from './modal.js';

/**
 * @param {{ need?: number, onDone?: () => void }} [opts]
 *   need : montant manquant en centimes, pour présélectionner une recharge suffisante
 */
export function openTopup(opts = {}) {
  if (!isLoggedIn()) {
    location.hash = '#/connexion';
    return;
  }
  const { need = 0, onDone } = opts;
  const preset = RULES.topups.find((a) => a >= need) ?? RULES.topups[RULES.topups.length - 1];
  const first = isFirstDeposit();

  openModal({
    title: 'Recharger mon solde',
    size: 'sm',
    body: `
      <p class="note note--demo">${icon('info', { size: 16 })}<span><strong>Démonstration :</strong> ce sont des crédits fictifs, aucun paiement n'est effectué.</span></p>
      ${need > 0 ? `<p class="muted">Il te manque <strong>${eur(need)}</strong> pour cet achat.</p>` : ''}
      <div class="amounts" role="radiogroup" aria-label="Montant de la recharge">
        ${RULES.topups
          .map(
            (a) => `<label class="amount"><input type="radio" name="topup" value="${a}" ${a === preset ? 'checked' : ''}><span>${eurShort(a)}</span></label>`,
          )
          .join('')}
      </div>
      ${first ? `<p class="small">${icon('gift', { size: 15 })} Premier dépôt : <strong>+${Math.round(RULES.bonus.firstDepositRate * 100)} % de bonus</strong> (jusqu'à ${eurShort(RULES.bonus.firstDepositMax)}), à jouer ${RULES.bonus.wagering} fois. Une carte payée avec le bonus ne s'expédie pas avant ; le bonus restant est repris s'il n'y a plus rien à jouer.</p>` : ''}
      <p class="muted small">Solde actuel : <strong>${eur(getState().balance)}</strong></p>`,
    footer: `<button class="btn btn--secondary" type="button" data-close>Annuler</button>
             <button class="btn btn--primary" type="button" data-topup-confirm>${icon('plus', { size: 16 })}<span>Créditer</span></button>`,
    onMount(el, close) {
      el.querySelector('[data-topup-confirm]').addEventListener('click', () => {
        const amount = Number(el.querySelector('input[name="topup"]:checked')?.value);
        const res = deposit(amount);
        if (!res.ok) {
          toast(res.message, 'error');
          return;
        }
        sfx.coins();
        toast(res.bonus ? `${eur(amount)} crédités, plus ${eur(res.bonus)} de bonus à jouer.` : `${eur(amount)} crédités sur ton solde (fictif).`, 'success');
        close();
        onDone?.();
      });
    },
  });
}
