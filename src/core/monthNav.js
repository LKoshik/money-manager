/** Moving between months for the Reports month picker. Month keys look like "2026-10". */

import { toMonthKey } from './dates.js';

/**
 * Move a month key forwards or backwards.
 * @param {string} key  Example: "2026-01"
 * @param {number} delta  -1 = previous month, 1 = next month.
 * @returns {string} Example: "2025-12"
 */
export function shiftMonthKey(key, delta) {
  const [year, month] = key.split('-').map(Number);
  const moved = new Date(year, month - 1 + delta, 1);
  return `${moved.getFullYear()}-${String(moved.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Keep a month inside the allowed range. Plain text comparison works because keys are zero-padded.
 * @param {string} key
 * @param {string} oldest
 * @param {string} newest
 * @returns {string}
 */
export function clampMonthKey(key, oldest, newest) {
  if (key > newest) return newest;
  if (key < oldest) return oldest;
  return key;
}

/**
 * The month of the oldest transaction of any type.
 * @param {Array<{date: string}>} transactions
 * @param {string} fallback  Used when there are no transactions.
 * @returns {string}
 */
export function getOldestMonthKey(transactions, fallback) {
  let oldest = null;
  for (const txn of transactions) {
    const key = toMonthKey(txn.date);
    if (key && (oldest === null || key < oldest)) oldest = key;
  }
  return oldest ?? fallback;
}
