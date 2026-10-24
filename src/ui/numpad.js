/** The big number pad for typing amounts. Every key is at least 44px (see numpad.css). */

import { el } from './dom.js';
import { icon } from './icons.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
const ARIA_LABELS = { '.': 'Decimal point', back: 'Backspace' };

function buildKey(key, onKey) {
  return el(
    'button',
    {
      className: 'numpad-key',
      text: key === 'back' ? undefined : key,
      attrs: { type: 'button', 'aria-label': ARIA_LABELS[key] ?? key, 'data-key': key },
      on: { click: () => onKey(key) },
    },
    key === 'back' && icon('backspace', 26),
  );
}

/**
 * Make a number pad.
 * @param {{onKey: (key: string) => void}} options  key is "0"-"9", "." or "back".
 *   The pad has no state: the caller keeps the typed text (see core/amountInput.js).
 * @returns {HTMLElement}
 */
export function numpad({ onKey }) {
  return el('div', { className: 'numpad' }, ...KEYS.map((key) => buildKey(key, onKey)));
}
