/** Turns the typed limit of the budget sheet into paise, or says what is wrong. */

import { textToPaise } from './amountInput.js';

/**
 * Check the typed limit.
 * @param {string} text  What the number pad produced. Example: "5000"
 * @returns {{paise: number|null, problem: string|null}} Exactly one of them is null.
 */
export function limitTextToPaise(text) {
  const paise = textToPaise(text);
  if (paise === null) return { paise: null, problem: 'Type the monthly limit.' };
  if (paise <= 0) return { paise: null, problem: 'The limit must be more than zero.' };
  return { paise, problem: null };
}
