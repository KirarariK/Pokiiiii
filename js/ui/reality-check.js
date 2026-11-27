// Rappel de session : à intervalle régulier, un point sur le temps passé et le
// bilan de la session. C'est un garde-fou classique des jeux d'argent régulés.

import { eur } from '../format.js';
import { icon } from '../icons.js';
import { activitySince, getState, isLoggedIn } from '../store.js';
import { openModal } from './modal.js';

const sessionStart = Date.now();
let lastCheck = sessionStart;

function show() {
  const minutes = Math.max(1, Math.round((Date.now() - sessionStart) / 60_000));
  const { spent, received, net } = activitySince(sessionStart);
  openModal({
    title: 'Petit point sur ta session',
    size: 'sm',
    body: `
      <p>Tu es là depuis <strong>${minutes} min</strong>.</p>
      <dl class="kv">
        <div><dt>Dépensé en packs</dt><dd>${eur(spent)}</dd></div>
        <div><dt>Reçu en reventes</dt><dd>${eur(received)}</dd></div>
        <div><dt>Bilan de la session</dt><dd><strong class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : '−'}${eur(Math.abs(net))}</strong></dd></div>
      </dl>
      <p class="muted small">Tu peux régler la fréquence de ce rappel, fixer une limite ou faire une pause dans les paramètres.</p>`,
    footer: `<a class="btn btn--secondary" href="#/parametres" data-close>${icon('shield', { size: 16 })}Limites et pause</a>
             <button class="btn btn--secondary" type="button" data-close data-action="logout">${icon('log-out', { size: 16 })}Arrêter là</button>
             <button class="btn btn--secondary" type="button" data-close>Continuer</button>`,
  });
}

/** Lance la surveillance : le rappel s'affiche quand rien d'autre n'est en cours à l'écran. */
export function startRealityCheck() {
  setInterval(() => {
    const every = getState().settings.realityCheck || 60;
    if (!isLoggedIn()) return;
    if (Date.now() - lastCheck < every * 60_000) return;
    const busy = document.documentElement.classList.contains('has-modal') || document.getElementById('shell')?.classList.contains('is-immersive');
    if (busy) return; // on réessaie au prochain passage, sans interrompre une ouverture
    lastCheck = Date.now();
    show();
  }, 20_000);
}
