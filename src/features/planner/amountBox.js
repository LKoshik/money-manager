/** A small money text box for the planner sheets (digits and one decimal point only). */

import { el } from '../../ui/dom.js';
import { sanitizeAmount } from '../../core/amountInput.js';

/**
 * @param {string} value  The text to start with.
 * @param {string} label  Read out by screen readers.
 * @param {(text: string) => void} onInput  Gets the cleaned text after every key.
 * @returns {HTMLInputElement}
 */
export function amountInput(value, label, onInput) {
  const input = el('input', {
    className: 'field-input plan-amount',
    attrs: { type: 'text', inputmode: 'decimal', placeholder: '0', autocomplete: 'off', 'aria-label': label, value },
    on: {
      input() {
        const clean = sanitizeAmount(input.value);
        if (clean !== input.value) input.value = clean;
        onInput(clean);
      },
    },
  });
  return input;
}
