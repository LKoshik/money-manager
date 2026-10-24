/**
 * Rules of the number pad. While the amount is typed it is kept as TEXT
 * ("12.5"), because half-finished numbers like "12." or "0.0" are normal
 * when typing, and a number type cannot hold them. Only at the end the text
 * becomes integer paise.
 */

import { rupeesToPaise, formatPlain } from './money.js';

export const MAX_WHOLE_DIGITS = 9;
export const MAX_DECIMALS = 2;
const GROUPED = new Intl.NumberFormat('en-IN');

/**
 * Apply one key press to the typed text.
 * @param {string} text  What is typed so far. Example: "12"
 * @param {string} key  "0"-"9", ".", or "back" (backspace). Anything else is ignored.
 * @returns {string} The new text.
 */
export function pressKey(text, key) {
  if (key === 'back') return text.slice(0, -1);
  if (key === '.') {
    if (text.includes('.')) return text;
    return text === '' ? '0.' : `${text}.`;
  }
  if (!/^\d$/.test(key)) return text;
  const [whole, fraction] = text.split('.');
  if (fraction !== undefined) return fraction.length >= MAX_DECIMALS ? text : text + key;
  if (text === '0') return key; // no leading zeros: "05" becomes "5"
  return whole.length >= MAX_WHOLE_DIGITS ? text : text + key;
}

/**
 * Clean text that was typed or pasted into a normal text box, using the
 * same rules as the number pad.
 * @param {string} text
 * @returns {string} Only digits and at most one dot, within the limits.
 */
export function sanitizeAmount(text) {
  return [...String(text)].reduce(
    (result, char) => (char === '.' || /\d/.test(char) ? pressKey(result, char) : result),
    '',
  );
}

/**
 * Turn typed text into paise.
 * @param {string} text
 * @returns {number|null} Paise, or null if there is nothing valid yet.
 */
export function textToPaise(text) {
  return text === '' ? null : rupeesToPaise(text);
}

/**
 * Turn paise into the shortest text the number pad would produce.
 * @param {number} paise  Example: 25050
 * @returns {string} Example: "250.5". Whole rupees have no dot: 25000 gives "250".
 */
export function paiseToText(paise) {
  return formatPlain(paise).replace(/\.?0+$/, '');
}

/**
 * Show typed text with Indian digit grouping, keeping a half-typed dot.
 * @param {string} text  Example: "100000.5"
 * @returns {string} Example: "1,00,000.5". Empty text shows "0".
 */
export function formatAmountText(text) {
  if (text === '') return '0';
  const [whole, fraction] = text.split('.');
  const shown = GROUPED.format(Number(whole));
  return fraction === undefined ? shown : `${shown}.${fraction}`;
}
