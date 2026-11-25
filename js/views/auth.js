// Connexion / inscription au compte démo (pseudo uniquement, stocké localement).

import { BRAND, RULES } from '../config.js';
import { esc, eur } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn, login, signup } from '../store.js';
import { note } from '../ui/blocks.js';
import { toast } from '../ui/modal.js';
import { logoMark } from '../ui/shell.js';

/** N'accepte qu'un chemin interne comme destination après connexion. */
function safeRedirect(value) {
  return typeof value === 'string' && /^\/[a-z0-9/_?=&%-]*$/i.test(value) && !value.startsWith('//') ? value : '/packs';
}

export default {
  title: 'Connexion',
  render({ query }) {
    const existing = getState().user;
    const mode = query.mode === 'inscription' || !existing ? 'inscription' : 'connexion';
    const signupMode = mode === 'inscription';
    const redirect = query.redirect ? `&redirect=${encodeURIComponent(query.redirect)}` : '';
    return `
    <section class="auth">
      <div class="auth__brand">${logoMark(44)}<h1>${esc(BRAND.name)}</h1><p class="muted">${esc(BRAND.tagline)}</p></div>
      <div class="panel panel--pad auth__card">
        <nav class="tabs tabs--full" aria-label="Accès au compte">
          <a class="tab ${!signupMode ? 'is-active' : ''}" ${!signupMode ? 'aria-current="page"' : ''} href="#/connexion?mode=connexion${redirect}">Se connecter</a>
          <a class="tab ${signupMode ? 'is-active' : ''}" ${signupMode ? 'aria-current="page"' : ''} href="#/connexion?mode=inscription${redirect}">S'inscrire</a>
        </nav>

        <form class="form" data-auth novalidate>
          <div class="field">
            <label for="auth-pseudo">Pseudo</label>
            <input class="input" id="auth-pseudo" name="pseudo" autocomplete="username" required minlength="3" maxlength="16" placeholder="${signupMode ? 'Choisis un pseudo' : 'Ton pseudo'}" value="${!signupMode && existing ? esc(existing.pseudo) : ''}" autofocus>
            <span class="hint">3 à 16 caractères : lettres, chiffres, tiret ou underscore.</span>
          </div>
          ${
            signupMode
              ? `<label class="check"><input type="checkbox" name="age" required><span>Je certifie avoir ${RULES.minAge} ans ou plus.</span></label>
                 <label class="check"><input type="checkbox" name="terms" required><span>J'accepte les <a href="#/legal/cgu">conditions d'utilisation</a> et la <a href="#/legal/confidentialite">politique de confidentialité</a>.</span></label>`
              : ''
          }
          <p class="form__error" data-error role="alert" hidden></p>
          <button class="btn btn--primary btn--lg btn--block" type="submit">${icon(signupMode ? 'user-plus' : 'log-in', { size: 18 })}${signupMode ? 'Créer mon compte démo' : 'Se connecter'}</button>
        </form>

        ${note(
          signupMode
            ? `Démonstration : aucun mot de passe ni e-mail. Le compte est enregistré dans ce navigateur et reçoit <strong>${eur(RULES.welcomeCredit)}</strong> de crédits fictifs.`
            : "Démonstration : le compte n'existe que dans ce navigateur.",
          'demo',
        )}
      </div>
    </section>`;
  },
  mount(root, { query, navigate }) {
    if (isLoggedIn()) {
      navigate(safeRedirect(query.redirect), { replace: true });
      return null;
    }
    const form = root.querySelector('[data-auth]');
    const error = root.querySelector('[data-error]');
    const signupMode = Boolean(form.elements.age);
    const onSubmit = (e) => {
      e.preventDefault();
      const fail = (message) => {
        error.textContent = message;
        error.hidden = false;
      };
      if (signupMode && !form.elements.age.checked) return fail(`Le site est réservé aux personnes de ${RULES.minAge} ans ou plus.`);
      if (signupMode && !form.elements.terms.checked) return fail("Tu dois accepter les conditions d'utilisation.");
      const res = signupMode ? signup(form.elements.pseudo.value) : login(form.elements.pseudo.value);
      if (!res.ok) return fail(res.message);
      toast(signupMode ? `Bienvenue ! ${eur(RULES.welcomeCredit)} de crédits fictifs t'attendent.` : 'Content de te revoir.', 'success');
      navigate(safeRedirect(query.redirect), { replace: true });
      return undefined;
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  },
};
