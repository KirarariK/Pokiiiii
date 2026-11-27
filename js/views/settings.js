// Paramètres : thème, confort de jeu, garde-fous de jeu responsable, remise à zéro.

import { THEMES } from '../data/themes.js';
import { dateTimeFr, eur } from '../format.js';
import { icon } from '../icons.js';
import { RULES } from '../config.js';
import { dailyLimit, getState, isLoggedIn, resetDemo, setDailyLimit, setPause, setSetting, spentToday } from '../store.js';
import { applyTheme, currentTheme, saveTheme, themeCard, wireThemeGrid } from '../theme.js';
import { note, pageHead } from '../ui/blocks.js';
import { confirmDialog, toast } from '../ui/modal.js';

const LIMITS = [null, 20_00, 50_00, 100_00, 250_00];
const REMINDERS = [
  [15, '15 min'],
  [30, '30 min'],
  [60, '1 heure'],
];

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
    const { pending } = dailyLimit();
    const reminder = settings.realityCheck || 60;
    const paused = limits.pauseUntil > Date.now();
    const logged = isLoggedIn();
    const theme = currentTheme();
    return `
    ${pageHead({ icon: 'user-cog', title: 'Paramètres' })}

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('palette', { size: 22 })}<span>Thème</span></h2><span class="badge badge--info">${theme.name} · ${theme.mood}</span></div>
      <p class="muted">Une ambiance par type. Le thème est gardé sur cet appareil, que tu sois connecté ou non.</p>
      <div class="theme-grid" role="radiogroup" aria-label="Thèmes" data-theme-grid>
        ${THEMES.map((t) => themeCard(t, { selected: t.id === theme.id })).join('')}
      </div>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('sliders-horizontal', { size: 22 })}<span>Confort de jeu</span></h2></div>
      <div class="settings">
        ${toggle('sound', 'Sons', "Effets sonores pendant l'ouverture des packs", settings.sound)}
        ${toggle('motion', 'Animations', 'Roulette, particules et inclinaison des cartes', settings.motion)}
        ${toggle('fast', 'Ouverture rapide', 'Passe la roulette : la carte se révèle tout de suite', settings.fast)}
        <div class="setting"><span><strong>Langue</strong><small>D'autres langues viendront plus tard</small></span><span class="muted setting__value">${icon('globe', { size: 16 })}Français</span></div>
      </div>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('shield', { size: 22 })}<span>Jeu responsable</span></h2></div>
      <p class="muted">Ouvrir des packs doit rester un plaisir. Ces garde-fous s'appliquent à ce que tu as décidé à tête reposée.</p>
      <div class="settings">
        <div class="setting setting--stack">
          <span><strong>Limite de dépenses quotidienne</strong><small>${logged ? `Dépensé aujourd'hui : ${eur(spentToday())}` : 'Connecte-toi pour suivre tes dépenses'}. Une baisse s'applique tout de suite ; un relèvement ou un retrait attend ${RULES.limitRaiseDelayHours} heures.</small>${pending ? `<small class="setting__pending">${icon('clock', { size: 14 })}${pending.daily == null ? 'Retrait de la limite' : `Passage à ${eur(pending.daily)}`} prévu le ${dateTimeFr(pending.from)}.</small>` : ''}</span>
          <div class="chips" role="radiogroup" aria-label="Limite quotidienne">
            ${LIMITS.map((v) => `<label class="chip-radio"><input type="radio" name="limit" value="${v ?? ''}" ${limits.daily === v ? 'checked' : ''}><span>${v == null ? 'Aucune' : eur(v)}</span></label>`).join('')}
          </div>
        </div>
        <div class="setting setting--stack">
          <span><strong>Rappel de session</strong><small>Un point régulier sur le temps passé et ton bilan depuis ton arrivée.</small></span>
          <div class="chips" role="radiogroup" aria-label="Rappel de session">
            ${REMINDERS.map(([v, label]) => `<label class="chip-radio"><input type="radio" name="reminder" value="${v}" ${reminder === v ? 'checked' : ''}><span>${label}</span></label>`).join('')}
          </div>
        </div>
        <div class="setting setting--stack">
          <span><strong>Faire une pause</strong><small>${paused ? `Achats et évolutions suspendus jusqu'au ${dateTimeFr(limits.pauseUntil)}.` : 'Suspend les achats, les recharges, les évolutions, la roue et les participations pendant la durée choisie. Une pause ne peut pas être levée avant son terme.'}</small></span>
          <div class="chips">
            <button class="btn btn--secondary btn--sm" type="button" data-pause="24" ${paused ? 'disabled' : ''}>24 heures</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="168" ${paused ? 'disabled' : ''}>7 jours</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="720" ${paused ? 'disabled' : ''}>30 jours</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="2160" ${paused ? 'disabled' : ''}>3 mois</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="4380" ${paused ? 'disabled' : ''}>6 mois</button>
            <button class="btn btn--secondary btn--sm" type="button" data-pause="8760" ${paused ? 'disabled' : ''}>12 mois</button>
          </div>
        </div>
      </div>
      <p class="small muted">Besoin d'en parler ? Joueurs Info Service : 09 74 75 13 13 (appel non surtaxé). <a href="#/transparence">En savoir plus</a></p>
    </section>

    <section class="panel panel--pad">
      <div class="section__head"><h2>${icon('rotate-ccw', { size: 22 })}<span>Données de la démonstration</span></h2></div>
      ${note('Ton compte, ton solde et ta collection sont enregistrés uniquement dans ce navigateur. Le thème est conservé à part.', 'demo')}
      <button class="btn btn--danger" type="button" data-reset>${icon('trash-2', { size: 16 })}Réinitialiser la démo</button>
    </section>`;
  },
  mount(root, { rerender, navigate }) {
    wireThemeGrid(root.querySelector('[data-theme-grid]'), {
      onSelect(id) {
        saveTheme(id);
        const theme = applyTheme(id);
        const tag = root.querySelector('.section__head .badge');
        if (tag) tag.textContent = `${theme.name} · ${theme.mood}`;
      },
    });

    const onChange = (e) => {
      const setting = e.target.closest('[data-setting]');
      if (setting) {
        setSetting(setting.dataset.setting, setting.checked);
        return;
      }
      if (e.target.name === 'limit') {
        const value = e.target.value === '' ? null : Number(e.target.value);
        const res = setDailyLimit(value);
        if (res.from) toast(`C'est noté : le changement prendra effet le ${dateTimeFr(res.from)}. D'ici là, ta limite actuelle reste en place.`, 'info', 6000);
        else toast(value == null ? 'Aucune limite quotidienne.' : `Limite quotidienne fixée à ${eur(value)}.`, 'success');
        rerender();
        return;
      }
      if (e.target.name === 'reminder') {
        const minutes = Number(e.target.value);
        setSetting('realityCheck', minutes);
        toast(`Rappel toutes les ${minutes} minutes.`, 'success');
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
          body: `<p>Achats, recharges, évolutions, roue et participations seront suspendus pendant <strong>${label}</strong>. Ta collection et ton solde restent accessibles.</p><p class="muted small">La pause ne peut pas être annulée avant son terme, même en réinitialisant la démo.</p>`,
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
          body: '<p>Ton compte démo, ton solde fictif, ta collection, tes tirages et tes réglages seront effacés de ce navigateur.</p><p class="muted small">Cette action est définitive. Ta limite de dépenses et une pause en cours sont conservées.</p>',
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
