/**
 * The base of modals and bottom sheets: a dark backdrop with a panel on top.
 * It makes a history entry (so the phone's Back button closes it), closes on
 * Escape and on a tap outside, and gives the focus back when it closes.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { pushOverlay } from './router.js';

/**
 * Open an overlay.
 * @param {{variant: 'modal'|'sheet', title: string, content: Node, onClose?: () => void,
 *   dismissible?: boolean}} options  onClose runs however it was closed.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openOverlay({ variant, title, content, onClose, dismissible = true }) {
  const previousFocus = document.activeElement;
  const titleId = `overlay-title-${Math.random().toString(36).slice(2)}`;
  let isOpen = true;

  const closeButton = el(
    'button',
    { className: 'icon-btn', attrs: { type: 'button', 'aria-label': 'Close' }, on: { click: () => close() } },
    icon('close'),
  );
  closeButton.hidden = !dismissible;
  const panel = el(
    'div',
    {
      className: `overlay-panel overlay-panel--${variant}`,
      attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, tabindex: '-1' },
    },
    el('div', { className: 'overlay-header' }, el('h2', { className: 'overlay-title', text: title, attrs: { id: titleId } }), closeButton),
    el('div', { className: 'overlay-body' }, content),
  );
  const backdrop = el(
    'div',
    {
      className: `overlay-backdrop overlay-backdrop--${variant}`,
      on: { click: (event) => dismissible && event.target === backdrop && close() },
    },
    panel,
  );

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && dismissible) close();
  };

  // Remove it from the page. Runs once, whichever way the overlay was closed.
  function finish() {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener('keydown', onKeyDown);
    backdrop.remove();
    previousFocus?.focus?.();
    onClose?.();
  }

  const closeHistoryEntry = pushOverlay(finish); // finish runs when the phone's Back closes it

  async function close() {
    if (!isOpen) return;
    await closeHistoryEntry();
    finish();
  }

  document.addEventListener('keydown', onKeyDown);
  document.body.append(backdrop);
  panel.focus();
  return { close, element: panel };
}
