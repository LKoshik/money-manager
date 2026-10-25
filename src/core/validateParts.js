/** Tiny checks shared by all validate*.js files, so each rule is written once. */

/** @param {unknown} value @returns {boolean} A plain object (not a list, not null). */
export const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
/** @param {unknown} value @returns {boolean} Text with at least one visible character. */
export const isText = (value) => typeof value === 'string' && value.trim().length > 0;
/** @param {unknown} value @returns {boolean} A whole number of paise. */
export const isPaise = (value) => Number.isSafeInteger(value);
// The shape check stops loose values like "5", which Date.parse() would accept.
/** @param {unknown} value @returns {boolean} A real ISO date text. */
export const isDateText = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));

/**
 * Keep only the messages of the rules that failed.
 * @param {Array<[boolean, string]>} rules  Pairs of [passed, message].
 * @returns {string[]}
 */
export function collect(rules) {
  return rules.filter(([ok]) => !ok).map(([, message]) => message);
}
