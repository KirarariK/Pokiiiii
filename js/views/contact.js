// Contact. En démonstration, le formulaire n'envoie rien.

import { BRAND } from '../config.js';
import { esc } from '../format.js';
import { icon } from '../icons.js';
import { note, pageHead } from '../ui/blocks.js';
import { toast } from '../ui/modal.js';

export default {
  title: 'Contact',
  render() {
    return `
    ${pageHead({ icon: 'mail', title: 'Contact', lead: 'Une question, un problème, une idée ? Écris-nous.' })}
    <div class="grid-2 grid-2--wide">
      <section class="panel panel--pad">
        <h2>Formulaire de contact</h2>
        <form class="form" data-contact novalidate>
          <div class="field"><label for="c-name">Nom complet</label><input class="input" id="c-name" name="name" autocomplete="name" required maxlength="80"></div>
          <div class="field"><label for="c-email">E-mail</label><input class="input" id="c-email" name="email" type="email" autocomplete="email" required maxlength="120"></div>
          <div class="field"><label for="c-subject">Sujet</label><input class="input" id="c-subject" name="subject" required maxlength="120"></div>
          <div class="field"><label for="c-message">Message</label><textarea class="input" id="c-message" name="message" rows="6" required maxlength="2000"></textarea><span class="hint">2 000 caractères maximum</span></div>
          <p class="form__error" data-error role="alert" hidden></p>
          <button class="btn btn--primary btn--lg" type="submit">${icon('send', { size: 18 })}Envoyer le message</button>
        </form>
        ${note("Démonstration : le formulaire n'est relié à aucune boîte de réception, rien n'est envoyé ni conservé.", 'demo')}
      </section>
      <aside class="panel panel--pad">
        <h2>Autres moyens</h2>
        <dl class="kv kv--stack">
          <div><dt>${icon('mail', { size: 16 })} E-mail</dt><dd><a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a></dd></div>
          <div><dt>${icon('map-pin', { size: 16 })} Adresse</dt><dd>${esc(BRAND.company)}<br>${esc(BRAND.address)}</dd></div>
          <div><dt>${icon('clock', { size: 16 })} Délai de réponse</dt><dd>24 à 48 heures ouvrées</dd></div>
        </dl>
      </aside>
    </div>`;
  },
  mount(root) {
    const form = root.querySelector('[data-contact]');
    const error = root.querySelector('[data-error]');
    const onSubmit = (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        error.textContent = 'Complète tous les champs avec une adresse e-mail valide.';
        error.hidden = false;
        form.querySelector(':invalid')?.focus();
        return;
      }
      error.hidden = true;
      form.reset();
      toast("Démonstration : le message n'a pas été envoyé.", 'info', 5000);
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  },
};
