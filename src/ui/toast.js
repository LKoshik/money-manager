/** A small message that appears for a few seconds, then goes away. */

import { el } from './dom.js';

/** Find (or create) the place where toasts appear. */
function getToastRoot() {
  let root = document.getElementById('toast-root');
  if (!root) {
    // role="status" makes screen readers read the message out loud.
    root = el('div', { className: 'toast-root', attrs: { id: 'toast-root', role: 'status', 'aria-live': 'polite' } });
    document.body.append(root);
  }
  return root;
}

/**
 * Show a message. A new toast replaces the one before it.
 * @param {string} message
 * @param {{kind?: 'info'|'error', duration?: number}} [options]  duration is in milliseconds.
 */
export function showToast(message, { kind = 'info', duration = 3000 } = {}) {
  const toast = el('div', { className: `toast toast--${kind}`, text: message });
  getToastRoot().replaceChildren(toast);
  // If a newer toast already replaced this one, remove() on it does nothing.
  setTimeout(() => toast.remove(), duration);
}
