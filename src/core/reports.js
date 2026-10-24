/**
 * Report calculations.
 * Reports only look at income and expense. A transfer just moves money
 * between your own accounts, so it must never appear here.
 */

import { isInRange, toMonthKey } from './dates.js';

/** Group name for an expense that somehow has no category. */
export const UNCATEGORIZED = 'uncategorized';

/**
 * Total income and expense inside a date range.
 * @param {Array<object>} transactions
 * @param {{start: string, end: string}} range
 * @returns {{income: number, expense: number, net: number}} Paise.
 */
export function getPeriodTotals(transactions, range) {
  let income = 0;
  let expense = 0;
  for (const txn of transactions) {
    if (!isInRange(txn.date, range)) continue;
    if (txn.type === 'income') income += txn.amount;
    else if (txn.type === 'expense') expense += txn.amount;
  }
  return { income, expense, net: income - expense };
}

/**
 * Spending by category inside a date range, biggest first (for the pie chart).
 * @param {Array<object>} transactions
 * @param {{start: string, end: string}} range
 * @returns {Array<{categoryId: string, total: number, share: number}>}
 *   "share" is a fraction from 0 to 1.
 */
export function getSpendingByCategory(transactions, range) {
  const totals = new Map();
  let all = 0;
  for (const txn of transactions) {
    if (txn.type !== 'expense' || !isInRange(txn.date, range)) continue;
    const key = txn.categoryId ?? UNCATEGORIZED;
    totals.set(key, (totals.get(key) ?? 0) + txn.amount);
    all += txn.amount;
  }
  return [...totals]
    .map(([categoryId, total]) => ({ categoryId, total, share: all > 0 ? total / all : 0 }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Income and expense for each month in a list (for the bar chart).
 * Months with no transactions still appear, with zeros.
 * @param {Array<object>} transactions
 * @param {string[]} monthKeys  Example: ["2026-08", "2026-09", "2026-10"]
 * @returns {Array<{key: string, income: number, expense: number}>} Same order as monthKeys.
 */
export function getIncomeVsExpenseByMonth(transactions, monthKeys) {
  const rows = new Map(monthKeys.map((key) => [key, { key, income: 0, expense: 0 }]));
  for (const txn of transactions) {
    if (txn.type !== 'income' && txn.type !== 'expense') continue;
    const row = rows.get(toMonthKey(txn.date));
    if (row) row[txn.type] += txn.amount;
  }
  return monthKeys.map((key) => rows.get(key));
}
