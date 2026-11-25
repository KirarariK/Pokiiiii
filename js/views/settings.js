// Paramètres : apparence, sons, garde-fous de jeu responsable, remise à zéro.

import { dateTimeFr, eur } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn, resetDemo, setDailyLimit, setPause, setSetting, spentToday } from '../store.js';
import { note, pageHead } from '../ui/blocks.js';
import { confirmDialog, toast } from '../ui/modal.js';

const LIMITS = [null, 20_00, 50_00, 100_00, 250_00];

function toggle(key, label, hint, checked) {
  return `<label class="setting">
    <span><strong>${label}</strong><small>${hint}</small></span>
    <span class="switch"><input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''}><span class="switch__track"></span></span>
  </label>`;
}

export default {
  nav: 'parametres',
  title: 'Paramètres',
  render() {
    const { settings, limits } = getState();
    const paused = limits.pauseUntil > Date.now();
    const logged = isLoggedIn();
    return `
    ${pageHead({ icon: 'user-cog', title: 'Paramètres' })}

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('sliders-horizontal', { size: 22 })}<span>Affichage et sons</span></h2></div>
      <div class="settings">
        ${toggle('dark', 'Mode sombre', "Thème de l'interface", settings.theme === 'dark')}
        ${toggle('sound', 'Sons', "Effets sonores pendant l'ouverture des packs", settings.sound)}
        ${toggle('motion', 'Animations', "Animation d'ouverture, particules et inclinaison des cartes", settings.motion)}
        <div class="setting"><span><strong>Langue</strong><small>D'autres langues viendront plus tard</small></span><span class="muted setting__value">${icon('globe', { size: 16 })}Français</span></div>
      </div>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('shield', { size: 22 })}<span>Jeu responsable</span></h2></div>
      <p class="muted">Ouvrir des packs doit rester un plaisir. Ces garde-fous bloquent les achats au-delà de ce que tu as décidé à tête reposée.</p>
      <div class="settings">
        <div class="setting setting--stack">
          <span><strong>Limite de dépenses quotidienne</strong><small>${logged ? `Dépensé aujourd'hui : ${eur(spentToday())}` : 'Connecte-toi pour suivre tes dépenses'}</small></span>
          <div class="chips" role="radiogroup" aria-label="Limite quotidienne">
            ${LIMITS.map((v) => `<label class="chip-radio"><input type="radio" name="limit" value="${v ?? ''}" ${limits.daily === v ? 'checked' : ''}><span>${v == null ? 'Aucune' : eur(v)}</span></label>`).join('')}
          </div>
        </div>
        <div class="setting setting--stack">
          <span><strong>Faire une pause</strong><small>${paused ? `Achats suspendus jusqu'au ${dateTimeFr(limits.pauseUntil)}.` : 'Suspend tous les achats pendant la durée choisie. Une pause ne peut pas être levée avant son terme.'}</small></span>
          <div class="chips">
            <button class="btn btn--secondary btn--sm" type="button" data-pause="24" ${paused ? 'disabled' : ''}>24 heures</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="168" ${paused ? 'disabled' : ''}>7 jours</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="720" ${paused ? 'disabled' : ''}>30 jours</button>
          </div>
        </div>
      </div>
      <p class="small muted">Besoin d'en parler ? Joueurs Info Service : 09 74 75 13 13 (appel non surtaxé). <a href="#/transparence">En savoir plus</a></p>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('rotate-ccw', { size: 22 })}<span>Données de la démonstration</span></h2></div>
      ${note('Ton compte, ton solde et ta collection sont enregistrés uniquement dans ce navigateur.', 'demo')}
      <button class="btn btn--danger" type="button" data-reset>${icon('trash-2', { size: 16 })}Réinitialiser la démo</button>
    </section>`;
  },
  mount(root, { rerender, navigate }) {
    const onChange = (e) => {
      const setting = e.target.closest('[data-setting]');
      if (setting) {
        if (setting.dataset.setting === 'dark') setSetting('theme', setting.checked ? 'dark' : 'light');
        else setSetting(setting.dataset.setting, setting.checked);
        return;
      }
      if (e.target.name === 'limit') {
        const value = e.target.value === '' ? null : Number(e.target.value);
        setDailyLimit(value);
        toast(value == null ? 'Limite quotidienne retirée.' : `Limite quotidienne fixée à ${eur(value)}.`, 'success');
        rerender();
      }
    };
    const onClick = async (e) => {
      const pause = e.target.closest('[data-pause]');
      if (pause) {
        const hours = Number(pause.dataset.pause);
        const label = pause.textContent.trim();
        const ok = await confirmDialog({
          title: 'Mettre mon compte en pause ?',
          confirm: `Pause de ${label}`,
          body: `<p>Tu ne pourras plus acheter de pack pendant <strong>${label}</strong>. Ta collection et ton solde restent accessibles.</p><p class="muted small">La pause ne peut pas être annulée avant son terme.</p>`,
        });
        if (!ok) return;
        setPause(hours);
        toast('Ton compte est en pause.', 'info');
        rerender();
        return;
      }
      if (e.target.closest('[data-reset]')) {
        const ok = await confirmDialog({
          title: 'Réinitialiser la démo ?',
          confirm: 'Tout effacer',
          danger: true,
          body: '<p>Ton compte démo, ton solde fictif, ta collection et tes réglages seront effacés de ce navigateur.</p><p class="muted small">Cette action est définitive.</p>',
        });
        if (!ok) return;
        resetDemo();
        toast('La démo a été réinitialisée.', 'success');
        navigate('/');
      }
    };
    root.addEventListener('change', onChange);
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('change', onChange);
      root.removeEventListener('click', onClick);
    };
  },
};
