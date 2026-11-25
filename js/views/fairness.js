// Équité prouvable : explication, graines du joueur, vérificateur et journal des tirages.

import { cardById, resolveTicket } from '../catalog.js';
import { PACKS, packBySlug } from '../data/packs.js';
import { TICKETS, isValidClientSeed, sha256Hex, ticketFor } from '../fair.js';
import { dateTimeFr, esc, eur, num } from '../format.js';
import { icon } from '../icons.js';
import { getState, isLoggedIn, revealedSeed, rotateSeeds } from '../store.js';
import { note, pageHead } from '../ui/blocks.js';
import { confirmDialog, toast } from '../ui/modal.js';

const short = (hex) => `${hex.slice(0, 10)}…${hex.slice(-6)}`;

const GAMES = [...PACKS.map((p) => ({ id: `pack:${p.slug}`, label: p.name })), { id: 'evolution', label: 'Évolution' }, { id: 'cashback', label: 'Roue du cashback' }];

/** Ce qu'un ticket donne pour un jeu : la carte du pack, ou le ticket seul. */
function describe(game, ticket) {
  if (game.startsWith('pack:')) {
    const pack = packBySlug(game.slice(5));
    if (!pack) return '';
    const drop = resolveTicket(pack, ticket);
    return `${esc(drop.card.name)} (${eur(drop.card.value)}), plage ${num(drop.from)} – ${num(drop.to - 1)}`;
  }
  if (game === 'evolution') return 'Réussite si le ticket est inférieur au seuil affiché lors de la tentative';
  return 'Multiplicateur lu dans le barème de la roue du cashback';
}

function outcome(roll) {
  const o = roll.outcome || {};
  if (o.cardId) return esc(cardById(o.cardId)?.name || o.cardId);
  if ('win' in o) return `${o.win ? 'Réussite' : 'Échec'} (seuil ${num(o.winBelow)})`;
  if ('amount' in o) return `+${eur(o.amount)}`;
  return '';
}

/** Vérifie un tirage du journal dès que sa graine serveur a été révélée. */
function status(roll) {
  const seed = revealedSeed(roll.hash);
  if (!seed) return `<span class="muted">${icon('lock', { size: 14 })} Graine en cours</span>`;
  const ok = ticketFor(seed, roll.clientSeed, roll.nonce, roll.game) === roll.ticket;
  return ok
    ? `<span class="pos">${icon('circle-check', { size: 15 })} Conforme</span> <button class="btn btn--ghost btn--sm" type="button" data-fill="${roll.id}">Détail</button>`
    : `<span class="neg">${icon('circle-alert', { size: 15 })} Écart</span>`;
}

function seedsPanel() {
  if (!isLoggedIn()) {
    return `<section class="panel panel--pad"><div class="section__head"><h2>${icon('key-round', { size: 22 })}<span>Tes graines</span></h2></div>
      <p class="muted">Connecte-toi pour voir l'empreinte de ta graine serveur, choisir ta graine client et vérifier tes tirages.</p>
      <a class="btn btn--primary" href="#/connexion?redirect=%2Fequite">${icon('log-in', { size: 16 })}Se connecter</a></section>`;
  }
  const f = getState().fair;
  return `<section class="panel panel--pad">
    <div class="section__head"><h2>${icon('key-round', { size: 22 })}<span>Tes graines en cours</span></h2></div>
    <dl class="kv kv--stack seeds">
      <div><dt>${icon('fingerprint', { size: 15 })} Empreinte de la graine serveur (SHA-256)</dt><dd><code>${esc(f.serverHash)}</code></dd></div>
      <div><dt>${icon('user', { size: 15 })} Graine client</dt><dd><code>${esc(f.clientSeed)}</code></dd></div>
      <div><dt>${icon('hash', { size: 15 })} Prochain tirage</dt><dd>n° ${num(f.nonce)} · ${num(f.nonce)} tirage${f.nonce > 1 ? 's' : ''} depuis le ${dateTimeFr(f.since)}</dd></div>
    </dl>
    <form class="form seeds__form" data-rotate novalidate>
      <div class="field">
        <label for="seed-client">Nouvelle graine client <span class="muted">(facultatif)</span></label>
        <input class="input" id="seed-client" name="client" maxlength="64" autocomplete="off" spellcheck="false" placeholder="Laisse vide pour une graine aléatoire">
        <span class="hint">4 à 64 caractères, sans espace ni deux-points.</span>
      </div>
      <button class="btn btn--primary" type="submit">${icon('rotate-cw', { size: 16 })}Renouveler mes graines</button>
    </form>
    <p class="small muted">Renouveler révèle la graine serveur en cours : tous les tirages faits avec elle deviennent vérifiables ci-dessous, et une nouvelle paire prend le relais.</p>
  </section>`;
}

function verifierPanel() {
  return `<section class="panel panel--pad">
    <div class="section__head"><h2>${icon('scan-face', { size: 22 })}<span>Vérifier un tirage</span></h2></div>
    <p class="muted">Recalcule un ticket à partir d'une graine serveur révélée. Le calcul est fait dans ton navigateur ; tu peux aussi le refaire avec n'importe quel outil HMAC-SHA256.</p>
    <form class="form" data-verify novalidate>
      <div class="field"><label for="v-server">Graine serveur (révélée)</label><input class="input" id="v-server" name="server" autocomplete="off" spellcheck="false" required></div>
      <div class="field-row">
        <div class="field"><label for="v-client">Graine client</label><input class="input" id="v-client" name="client" autocomplete="off" spellcheck="false" required></div>
        <div class="field"><label for="v-nonce">Numéro du tirage</label><input class="input" id="v-nonce" name="nonce" type="number" min="0" step="1" inputmode="numeric" required></div>
      </div>
      <div class="field"><label for="v-game">Jeu</label>
        <select class="input" id="v-game" name="game">${GAMES.map((g) => `<option value="${g.id}">${esc(g.label)}</option>`).join('')}</select>
      </div>
      <button class="btn btn--secondary" type="submit">${icon('check', { size: 16 })}Calculer le ticket</button>
      <div class="verify" data-verify-out hidden></div>
    </form>
  </section>`;
}

function historyPanel() {
  if (!isLoggedIn()) return '';
  const { rolls, fair } = getState();
  return `<section class="panel panel--pad">
    <div class="section__head"><h2>${icon('history', { size: 22 })}<span>Mes tirages</span></h2></div>
    ${
      rolls.length
        ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Date</th><th>Jeu</th><th class="num">N°</th><th class="num">Ticket</th><th>Résultat</th><th>Empreinte</th><th>Vérification</th></tr></thead>
            <tbody>
              ${rolls
                .slice(0, 60)
                .map(
                  (r) => `<tr>
                    <td class="nowrap muted">${dateTimeFr(r.at)}</td>
                    <td>${esc(r.label)}</td>
                    <td class="num">${num(r.nonce)}</td>
                    <td class="num">${num(r.ticket)}</td>
                    <td>${outcome(r)}</td>
                    <td><code title="${esc(r.hash)}">${esc(short(r.hash))}</code></td>
                    <td class="nowrap">${status(r)}</td>
                  </tr>`,
                )
                .join('')}
            </tbody>
          </table></div>`
        : '<p class="muted">Aucun tirage pour le moment. Ouvre un pack : il apparaîtra ici avec son ticket.</p>'
    }
    ${
      fair.archive.length
        ? `<details class="acc"><summary><span>Graines serveur révélées (${fair.archive.length})</span>${icon('chevron-down', { size: 18 })}</summary>
            <div class="acc__body">${fair.archive
              .map((a) => `<p class="small"><code>${esc(a.serverSeed)}</code><br><span class="muted">empreinte ${esc(short(a.serverHash))} · graine client <code>${esc(a.clientSeed)}</code> · ${num(a.nonce)} tirage${a.nonce > 1 ? 's' : ''} · jusqu'au ${dateTimeFr(a.until)}</span></p>`)
              .join('')}</div></details>`
        : ''
    }
  </section>`;
}

export default {
  nav: 'equite',
  title: 'Équité prouvable',
  render() {
    return `
    ${pageHead({ icon: 'shield-check', title: 'Équité prouvable', lead: "Chaque tirage est fixé avant que tu joues, et tu peux le recalculer toi-même après coup. Personne, pas même nous, ne peut le modifier en cours de route." })}

    <section class="panel panel--pad prose">
      <h2>${icon('dices', { size: 22 })}Le principe</h2>
      <ol>
        <li><strong>Avant de jouer</strong>, nous créons une graine serveur secrète et nous t'en montrons l'empreinte SHA-256. Une empreinte ne permet pas de retrouver la graine, mais elle nous empêche d'en changer.</li>
        <li><strong>Tu choisis ta graine client</strong> (ou tu gardes celle tirée au hasard). Comme nous ne la connaissons pas à l'avance, nous ne pouvons pas préparer un résultat.</li>
        <li><strong>À chaque tirage</strong>, le ticket vaut <code>HMAC-SHA256(graine serveur, « graine client:numéro:jeu »)</code>, ramené à un nombre entre 0 et ${num(TICKETS - 1)}. La table publiée sur la page du pack dit quelle carte correspond à ce ticket.</li>
        <li><strong>Quand tu renouvelles tes graines</strong>, l'ancienne graine serveur est révélée : tu vérifies que son empreinte est bien celle annoncée, et tu recalcules tous tes tickets.</li>
      </ol>
      ${note("Démonstration : la graine serveur est créée et gardée dans ton navigateur, donc lisible par qui sait où chercher. En production, elle reste sur nos serveurs jusqu'à son renouvellement, et les tables de tirage sont figées et datées.", 'demo')}
    </section>

    ${seedsPanel()}
    ${historyPanel()}
    ${verifierPanel()}`;
  },
  mount(root, { rerender }) {
    const onSubmit = async (e) => {
      const rotate = e.target.closest('[data-rotate]');
      if (rotate) {
        e.preventDefault();
        const client = rotate.elements.client.value.trim();
        if (client && !isValidClientSeed(client)) {
          toast('Graine client invalide : 4 à 64 caractères, sans espace ni deux-points.', 'error');
          return;
        }
        const ok = await confirmDialog({
          title: 'Renouveler mes graines ?',
          confirm: 'Renouveler',
          body: '<p>La graine serveur en cours sera révélée et remplacée. Tes tirages passés deviendront vérifiables ; les suivants utiliseront la nouvelle paire.</p>',
        });
        if (!ok) return;
        const res = rotateSeeds(client);
        if (!res.ok) {
          toast(res.message, 'error');
          return;
        }
        toast('Graines renouvelées : tes anciens tirages sont vérifiables.', 'success');
        rerender();
        return;
      }
      const verify = e.target.closest('[data-verify]');
      if (verify) {
        e.preventDefault();
        const server = verify.elements.server.value.trim();
        const client = verify.elements.client.value.trim();
        const nonce = Number.parseInt(verify.elements.nonce.value, 10);
        const game = verify.elements.game.value;
        const out = verify.querySelector('[data-verify-out]');
        out.hidden = false;
        if (!server || !client || !Number.isInteger(nonce) || nonce < 0) {
          out.innerHTML = `<p class="neg">Renseigne la graine serveur, la graine client et le numéro du tirage.</p>`;
          return;
        }
        const ticket = ticketFor(server, client, nonce, game);
        out.innerHTML = `<dl class="kv kv--stack">
          <div><dt>Empreinte de cette graine serveur</dt><dd><code>${esc(sha256Hex(server))}</code></dd></div>
          <div><dt>Ticket</dt><dd><strong>${num(ticket)}</strong> sur ${num(TICKETS)}</dd></div>
          <div><dt>Résultat</dt><dd>${describe(game, ticket)}</dd></div>
        </dl>`;
      }
    };
    const onClick = (e) => {
      const fill = e.target.closest('[data-fill]');
      if (!fill) return;
      const roll = getState().rolls.find((r) => r.id === fill.dataset.fill);
      const seed = roll && revealedSeed(roll.hash);
      const form = root.querySelector('[data-verify]');
      if (!seed || !form) return;
      form.elements.server.value = seed;
      form.elements.client.value = roll.clientSeed;
      form.elements.nonce.value = roll.nonce;
      form.elements.game.value = roll.game;
      form.requestSubmit();
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    root.addEventListener('submit', onSubmit);
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('submit', onSubmit);
      root.removeEventListener('click', onClick);
    };
  },
};
