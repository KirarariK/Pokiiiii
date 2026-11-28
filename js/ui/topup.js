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
      <label class="amount-free">
        <span class="amount-free__label">Ou choisis ton montant</span>
        <span class="amount-free__box"><input type="text" inputmode="decimal" name="custom" autocomplete="off" maxlength="7" placeholder="Ex. 35" aria-describedby="topup-info"><b aria-hidden="true">€</b></span>
      </label>
      <p class="small" id="topup-info" data-topup-info aria-live="polite"></p>
      ${first ? `<p class="small muted">${icon('gift', { size: 15 })} Premier dépôt : +${Math.round(RULES.bonus.firstDepositRate * 100)} % de bonus (jusqu'à ${eurShort(RULES.bonus.firstDepositMax)}), à jouer ${RULES.bonus.wagering} fois. Une carte payée avec le bonus ne s'expédie pas avant ; le bonus restant est repris s'il n'y a plus rien à jouer.</p>` : ''}
      <p class="muted small">Solde actuel : <strong>${eur(getState().balance)}</strong></p>`,
    footer: `<button class="btn btn--secondary" type="button" data-close>Annuler</button>
             <button class="btn btn--primary" type="button" data-topup-confirm>${icon('plus', { size: 16 })}<span>Créditer</span></button>`,
    onMount(el, close) {
      const custom = el.querySelector('input[name="custom"]');
      const info = el.querySelector('[data-topup-info]');
      const confirm = el.querySelector('[data-topup-confirm]');
      const range = `de ${eurShort(RULES.topupMin)} à ${eurShort(RULES.topupMax)}`;
      /** Montant choisi en centimes, ou null s'il n'est pas valable. */
      const chosen = () => {
        const text = custom.value.trim().replace(/\s/g, '');
        if (!text) return Number(el.querySelector('input[name="topup"]:checked')?.value) || null;
        if (!/^\d{1,4}([.,]\d{1,2})?$/.test(text)) return null;
        const cents = Math.round(Number(text.replace(',', '.')) * 100);
        return cents >= RULES.topupMin && cents <= RULES.topupMax ? cents : null;
      };
      const paint = () => {
        const amount = chosen();
        confirm.disabled = !amount;
        confirm.querySelector('span').textContent = amount ? `Créditer ${eur(amount)}` : 'Créditer';
        custom.setAttribute('aria-invalid', String(!amount && !!custom.value.trim()));
        if (!amount) {
          info.innerHTML = `<span class="neg">Entre un montant ${range}.</span>`;
          return;
        }
        const bonus = first ? Math.min(RULES.bonus.firstDepositMax, Math.round(amount * RULES.bonus.firstDepositRate)) : 0;
        const short = need > 0 && amount < need ? ` Il manquera encore ${eur(need - amount)} pour cet achat.` : '';
        info.textContent = `${bonus ? `Avec le bonus : +${eur(bonus)} à jouer. ` : ''}Nouveau solde : ${eur(getState().balance + amount + bonus)}.${short}`;
      };
      custom.addEventListener('input', () => {
        if (custom.value.trim()) el.querySelectorAll('input[name="topup"]').forEach((r) => (r.checked = false));
        paint();
      });
      el.querySelectorAll('input[name="topup"]').forEach((r) =>
        r.addEventListener('change', () => {
          custom.value = '';
          paint();
        }),
      );
      custom.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirm.click();
      });
      paint();
      confirm.addEventListener('click', () => {
        const amount = chosen();
        if (!amount) return;
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
