// Comptes à rebours. Un seul minuteur met à jour tous les éléments
// [data-countdown="<horodatage ms>"] présents dans la page.

const pad = (n) => String(n).padStart(2, '0');

function parts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(total / 86400), h: Math.floor((total % 86400) / 3600), m: Math.floor((total % 3600) / 60), s: total % 60, total };
}

/**
 * Blocs « 5 jours : 15 heures : 49 min : 01 sec ».
 * @param {number} until  horodatage cible (ms)
 * @param {{ seconds?: boolean, cls?: string }} [opts]
 */
export function countdownBlocks(until, opts = {}) {
  const { seconds = true, cls = '' } = opts;
  const unit = (key, label) => `<span class="cd__unit"><b data-unit="${key}">--</b><small>${label}</small></span>`;
  const units = [unit('d', 'jours'), unit('h', 'heures'), unit('m', 'min')];
  if (seconds) units.push(unit('s', 'sec'));
  return `<span class="cd ${cls}" data-countdown="${until}" data-format="blocks" role="timer">${units.join('<i class="cd__sep" aria-hidden="true">:</i>')}</span>`;
}

/** Compte à rebours en ligne, format « 09:58 » ou « 5 j 15 h 49 min ». */
export function countdownInline(until, format = 'mmss', cls = '') {
  return `<span class="${cls}" data-countdown="${until}" data-format="${format}" role="timer">--</span>`;
}

function paint(el, now) {
  const until = Number(el.dataset.countdown);
  const p = parts(until - now);
  switch (el.dataset.format) {
    case 'blocks':
      el.querySelectorAll('[data-unit]').forEach((b) => {
        const key = b.dataset.unit;
        b.textContent = key === 'd' ? String(p.d) : pad(p[key]);
      });
      break;
    case 'long':
      el.textContent = p.d > 0 ? `${p.d} j ${pad(p.h)} h ${pad(p.m)} min` : `${pad(p.h)} h ${pad(p.m)} min ${pad(p.s)} s`;
      break;
    default:
      el.textContent = `${pad(Math.floor(p.total / 60))}:${pad(p.s)}`;
  }
  if (p.total === 0 && !el.dataset.done) {
    el.dataset.done = '1';
    el.dispatchEvent(new CustomEvent('countdown:end', { bubbles: true }));
  }
}

/** Met à jour immédiatement les comptes à rebours d'un conteneur. */
export function refreshCountdowns(root = document) {
  const now = Date.now();
  root.querySelectorAll('[data-countdown]').forEach((el) => paint(el, now));
}

let timer = null;

export function startCountdowns() {
  if (timer) return;
  timer = setInterval(() => refreshCountdowns(), 1000);
}
