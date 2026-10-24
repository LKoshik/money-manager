/**
 * Search and filter for the transaction list. Pure logic: data in, data out.
 */

import { isInRange } from './dates.js';
import { resolveDateRange } from './datePresets.js';
import { rupeesToPaise } from './money.js';

/** The filters when nothing is chosen. Never change this object; copy it. */
export const EMPTY_FILTERS = Object.freeze({
  query: '',
  datePreset: 'all',
  from: '',
  to: '',
  categoryId: null,
  accountId: null,
  type: null,
});

/**
 * How many of the filter-sheet filters are on (the search text is not counted).
 * @param {object} filters
 * @returns {number}
 */
export function countActiveFilters(filters) {
  return [filters.datePreset !== 'all', filters.categoryId, filters.accountId, filters.type].filter(Boolean).length;
}

/**
 * Is anything narrowing the list, including the search text?
 * @param {object} filters
 * @returns {boolean}
 */
export function hasActiveFilters(filters) {
  return countActiveFilters(filters) > 0 || filters.query.trim() !== '';
}

/** Does the search text match the note, category name, a tag, or the exact amount? */
function matchesQuery(txn, query, categoryNames) {
  const paise = rupeesToPaise(query);
  if (paise !== null && txn.amount === paise) return true;
  const words = [txn.note, categoryNames.get(txn.categoryId) ?? '', ...txn.tags];
  return words.some((word) => word.toLowerCase().includes(query));
}

/** A transfer belongs to both of its accounts. */
const usesAccount = (txn, accountId) => txn.accountId === accountId || txn.toAccountId === accountId;

/**
 * Keep the transactions that match every filter.
 * @param {object[]} transactions
 * @param {object} filters  Same shape as EMPTY_FILTERS.
 * @param {{categories: Array<{id: string, name: string}>}} lookups
 * @param {Date} [now=new Date()]  Passed in so tests can control time.
 * @returns {object[]} Same order as the input.
 */
export function filterTransactions(transactions, filters, { categories }, now = new Date()) {
  const query = filters.query.trim().toLowerCase();
  const range = resolveDateRange(filters, now);
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return transactions.filter(
    (txn) =>
      (!range || isInRange(txn.date, range)) &&
      (!filters.type || txn.type === filters.type) &&
      (!filters.categoryId || txn.categoryId === filters.categoryId) &&
      (!filters.accountId || usesAccount(txn, filters.accountId)) &&
      (!query || matchesQuery(txn, query, categoryNames)),
  );
}
