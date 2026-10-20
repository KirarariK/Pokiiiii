import { icon } from './icons.js';

const STEPS = [
  { id: 'combat', title: 'Combat 1v1', body: 'Ton lead se bat automatiquement. Utilise les Balls pour capturer avant le K.O.' },
  { id: 'hub', title: 'Hub', body: 'Ouvre le Hub pour Quêtes, Pass, Arènes, Invocations, Expéditions et plus.' },
  { id: 'quests', title: 'Quêtes & Pass', body: 'Chaque jour, complète des quêtes pour monter le Pass et gagner des récompenses.' },
  { id: 'grow', title: 'Progression', body: 'Explore les zones, défie les arènes, invoque et envoie des expéditions. Bonne chance !' },
];

export function ensureTutorial(state) {
  if (!state.settings) state.settings = { mute: false, tutorialDone: false };
  if (state.settings.tutorialStep == null) state.settings.tutorialStep = 0;
  return state.settings;
}

export function tutorialHtml(state) {
  ensureTutorial(state);
  if (state.settings.tutorialDone) return '';
  const step = STEPS[state.settings.tutorialStep] || STEPS[0];
  const n = state.settings.tutorialStep + 1;
  return `
    <div class="tut-overlay" id="tut-overlay">
      <div class="tut-card">
        <div class="tut-ico">${icon('help')}</div>
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        <div class="tut-actions">
          <span class="muted">${n}/${STEPS.length}</span>
          <button type="button" class="btn-primary" data-tut-next>${n >= STEPS.length ? 'Terminer' : 'Suivant'}</button>
        </div>
      </div>
    </div>`;
}

export function advanceTutorial(state) {
  ensureTutorial(state);
  state.settings.tutorialStep++;
  if (state.settings.tutorialStep >= STEPS.length) {
    state.settings.tutorialDone = true;
  }
  return state.settings.tutorialDone;
}
