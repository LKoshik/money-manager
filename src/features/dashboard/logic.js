/** Turns the store data into what the Home screen shows. */

import { buildDashboardModel } from '../../core/dashboardModel.js';

/**
 * The core model plus lookup maps, so a transaction row can find its category and account.
 * @param {{accounts: object[], categories: object[], transactions: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {ReturnType<typeof buildDashboardModel> & {accountsById: Map<string, object>,
 *   categoriesById: Map<string, object>}}
 */
export function buildHomeModel(state, now = new Date()) {
  const byId = (items) => new Map(items.map((item) => [item.id, item]));
  return {
    ...buildDashboardModel(state, now),
    // All accounts, archived too: an old transaction still shows its account's name.
    accountsById: byId(state.accounts),
    categoriesById: byId(state.categories),
  };
}
