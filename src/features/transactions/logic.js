/**
 * Helpers only for the History screen: the filters the person chose
 * (kept while the app is open) and the data for the list.
 */

import { EMPTY_FILTERS, filterTransactions } from '../../core/transactionFilter.js';
import { groupByDay } from '../../core/dates.js';

// Private to this file. Filters survive moving between tabs, and reset when the app restarts.
let filters = { ...EMPTY_FILTERS };

/** @returns {object} The current filters (same shape as EMPTY_FILTERS). */
export const getFilters = () => filters;

/** @param {object} patch  The filter fields to change. */
export function patchFilters(patch) {
  filters = { ...filters, ...patch };
}

/** Switch every filter off, including the search text. */
export function resetFilters() {
  filters = { ...EMPTY_FILTERS };
}

/**
 * Prepare the list.
 * @param {{transactions: object[], accounts: object[], categories: object[]}} state
 * @param {object} [current]  The filters to use.
 * @param {Date} [now]
 * @returns {{total: number, groups: Array<{day: string, items: object[]}>,
 *   accountsById: Map<string, object>, categoriesById: Map<string, object>}}
 *   total is the number of ALL transactions, so the screen can tell "none yet" from "no match".
 */
export function buildListModel(state, current = filters, now = new Date()) {
  const visible = filterTransactions(state.transactions, current, { categories: state.categories }, now);
  return {
    total: state.transactions.length,
    groups: groupByDay(visible),
    accountsById: new Map(state.accounts.map((account) => [account.id, account])),
    categoriesById: new Map(state.categories.map((category) => [category.id, category])),
  };
}
