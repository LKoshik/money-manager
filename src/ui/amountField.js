/** Step 1 of the Add flow: the amount shown big, with the number pad below it. */

import { el } from './dom.js';
import { numpad } from './numpad.js';
import { pressKey, formatAmountText } from '../core/amountInput.js';

/**
 * Make the amount display and number pad.
 * @param {{text: string, type: string, onChange: (text: string) => void}} config
 *   text is the amount typed so far; type colors it (expense red, income green).
 *   onChange gets the new text after every key.
 * @returns {HTMLElement}
 */
export function amountField({ text, type, onChange }) {
  let current = text;
  const display = el('div', { className: `amount-display amount-display--${type}`, attrs: { 'aria-live': 'polite' } });
  const draw = () => {
    display.textContent = `₹${formatAmountText(current)}`;
    display.classList.toggle('amount-display--empty', current === '');
  };
  const pad = numpad({
    onKey(key) {
      current = pressKey(current, key);
      draw();
      onChange(current);
    },
  });
  draw();
  return el('div', { className: 'stack' }, display, pad);
}
