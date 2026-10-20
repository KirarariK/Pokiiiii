/** Tutoriel premier lancement (après choix du starter) */

import { icon } from './icons.js';

const STEPS = [
  {
    id: 'combat',
    title: 'Combat 1v1',
    body: 'Votre premier Pokémon combat automatiquement les sauvages. Surveillez les PV et la vitesse du duel.',
    tip: 'Onglet Combat',
  },
  {
    id: 'catch',
    title: 'Capturer',
    body: 'Quand le sauvage est affaibli, utilisez une Ball. L’auto-capture peut le faire pour vous.',
    tip: 'Boutons Ball sous l’arène',
  },
  {
    id: 'hub',
    title: 'Hub',
    body: 'Le Hub regroupe quêtes, pass, profil, zones et options. Ouvrez-le depuis la barre du bas.',
    tip: 'Icône Hub',
  },
  {
    id: 'quests',
    title: 'Quêtes & Pass',
    body: 'Chaque jour, des quêtes et un pass offrent des récompenses. Un événement rotatif booste aussi vos gains.',
    tip: 'Hub → Quêtes',
  },
];

export function shouldShowTutorial(state) {
  return !!state && !state.tutorialDone;
}

export function renderTutorial(stepIndex = 0) {
  const i = Math.max(0, Math.min(STEPS.length - 1, stepIndex));
  const step = STEPS[i];
  const isLast = i >= STEPS.length - 1;
  return `
    <div class="tutorial-overlay" id="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tut-title">
      <div class="tutorial-card">
        <div class="tutorial-ico">${icon('help')}</div>
        <p class="tutorial-step">Étape ${i + 1} / ${STEPS.length}</p>
        <h2 id="tut-title">${step.title}</h2>
        <p>${step.body}</p>
        <p class="tutorial-tip">${icon('pin')} ${step.tip}</p>
        <div class="tutorial-actions">
          ${
            i > 0
              ? `<button type="button" class="btn-secondary" data-tut="prev">Retour</button>`
              : `<button type="button" class="btn-secondary" data-tut="skip">Passer</button>`
          }
          <button type="button" class="btn-primary" data-tut="${isLast ? 'done' : 'next'}">
            ${isLast ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>`;
}

export function tutorialStepCount() {
  return STEPS.length;
}
