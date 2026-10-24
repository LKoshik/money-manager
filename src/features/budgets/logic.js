/** Glue between the store and the Budgets screen: picks the month and builds the model. */

import { getCurrentMonthRange, toMonthKey } from '../../core/dates.js';
import { formatMonthLabel } from '../../core/dateLabels.js';
import { buildBudgetList } from '../../core/budgetList.js';

/**
 * Everything the Budgets screen shows for the current month.
 * @param {{categories: object[], budgets: object[], transactions: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {{monthLabel: string, rows: object[], unbudgeted: object[], summary: object|null}}
 */
export function buildBudgetsModel(state, now = new Date()) {
  const list = buildBudgetList(state, getCurrentMonthRange(now));
  return { monthLabel: formatMonthLabel(toMonthKey(now.toISOString()), true), ...list };
}
