// Fenêtres modales et notifications.

import { icon } from '../icons.js';
import { esc } from '../format.js';

const host = () => document.getElementById('overlays');

let current = null;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ouvre une fenêtre modale.
 * @param {{ title: string, body: string, footer?: string, size?: 'sm'|'md'|'lg', onMount?: (el: HTMLElement, close: () => void) => void, onClose?: () => void }} options
 * @returns {() => void} fonction de fermeture
 */
export function openModal({ title, body, footer = '', size = 'md', onMount, onClose }) {
  closeModal();
  const previous = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal';
  wrap.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__dialog modal__dialog--${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal__head">
        <h2 id="modal-title" class="modal__title">${esc(title)}</h2>
        <button class="btn btn--icon btn--ghost" type="button" data-close aria-label="Fermer">${icon('x')}</button>
      </header>
      <div class="modal__body">${body}</div>
      ${footer ? `<footer class="modal__foot">${footer}</footer>` : ''}
    </div>`;

  const close = () => {
    if (current !== handle) return;
    current = null;
    document.removeEventListener('keydown', onKey);
    wrap.classList.add('is-leaving');
    document.documentElement.classList.remove('has-modal');
    setTimeout(() => wrap.remove(), 180);
    onClose?.();
    if (previous instanceof HTMLElement && document.contains(previous)) previous.focus({ preventScroll: true });
  };
  const handle = { close };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...wrap.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  host().appendChild(wrap);
  document.documentElement.classList.add('has-modal');
  current = handle;
  onMount?.(wrap.querySelector('.modal__dialog'), close);
  const target = wrap.querySelector('[autofocus]') || wrap.querySelector('.modal__body ' + FOCUSABLE.split(', ').join(', .modal__body ')) || wrap.querySelector('[data-close].btn');
  target?.focus({ preventScroll: true });
  return close;
}

export function closeModal() {
  current?.close();
}

/**
 * Boîte de confirmation. La promesse rend true si l'action est confirmée.
 * @param {{ title: string, body: string, confirm?: string, cancel?: string, danger?: boolean }} options
 */
export function confirmDialog({ title, body, confirm = 'Confirmer', cancel = 'Annuler', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    openModal({
      title,
      size: 'sm',
      body,
      footer: `<button class="btn btn--secondary" type="button" data-close>${esc(cancel)}</button>
               <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-confirm autofocus>${esc(confirm)}</button>`,
      onMount(el, close) {
        el.querySelector('[data-confirm]').addEventListener('click', () => {
          answered = true;
          resolve(true);
          close();
        });
      },
      onClose() {
        if (!answered) resolve(false);
      },
    });
  });
}

const TOAST_ICONS = { success: 'circle-check', error: 'circle-alert', info: 'info' };

/** Notification éphémère en bas d'écran. */
export function toast(message, type = 'info', ms = 3600) {
  let stack = host().querySelector('.toasts');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toasts';
    stack.setAttribute('role', 'status');
    host().appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `${icon(TOAST_ICONS[type] || 'info', { size: 18 })}<span>${esc(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 250);
  }, ms);
}
