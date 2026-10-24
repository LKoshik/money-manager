/** A centered dialog, and a ready-made "Are you sure?" question. */

import { el } from './dom.js';
import { button } from './button.js';
import { openOverlay } from './overlay.js';

/**
 * Open a centered dialog.
 * @param {{title: string, content: Node, onClose?: () => void, dismissible?: boolean}} options
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openModal(options) {
  return openOverlay({ ...options, variant: 'modal' });
}

/**
 * Ask the person to confirm something.
 * @param {{title: string, message: string, confirmLabel?: string, danger?: boolean}} options
 *   danger: true makes the confirm button red (for deleting).
 * @returns {Promise<boolean>} true only if they pressed the confirm button.
 *   Closing it any other way (Cancel, Back, tap outside) gives false.
 */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let answer = false;
    const content = el(
      'div',
      { className: 'stack' },
      el('p', { text: message }),
      button({ label: confirmLabel, variant: danger ? 'danger' : 'primary', block: true, onClick: () => { answer = true; modal.close(); } }),
      button({ label: 'Cancel', variant: 'secondary', block: true, onClick: () => modal.close() }),
    );
    const modal = openModal({ title, content, onClose: () => resolve(answer) });
  });
}
