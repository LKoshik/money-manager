/**
 * Budget calculation.
 * A budget is a monthly spending limit for one category.
 * Only EXPENSES count. Income and transfers never use up a budget.
 */

import { isInRange } from './dates.js';

/** At this percent of the limit we show a warning. */
export const WARNING_PERCENT = 80;

/**
 * Add up what was spent in one category inside a date range.
 * @param {Array<object>} transactions
 * @param {string} categoryId
 * @param {{start: string, end: string}} range
 * @returns {number} Paise.
 */
export function calculateSpent(transactions, categoryId, range) {
  let spent = 0;
  for (const txn of transactions) {
    if (txn.type !== 'expense') continue; // transfers and income never count
    if (txn.categoryId !== categoryId) continue;
    if (!isInRange(txn.date, range)) continue;
    spent += txn.amount;
  }
  return spent;
}

/**
 * Work out the status of one budget.
 * Level is "ok", "warning" (80% or more) or "over" (more than the limit).
 * We compare whole numbers (not percents) so there is no float error.
 * @param {{monthlyLimit: number}} budget
 * @param {number} spent  Paise.
 * @returns {{limit: number, spent: number, remaining: number,
 *   percent: number, barPercent: number, level: 'ok'|'warning'|'over'}}
 */
export function getBudgetStatus(budget, spent) {
  const limit = budget.monthlyLimit;
  const hasLimit = limit > 0;
  // Rounded DOWN, so 79.9% never shows as 80% before the warning starts.
  const percent = hasLimit ? Math.floor((spent * 100) / limit) : 0;

  let level = 'ok';
  if (hasLimit && spent > limit) level = 'over';
  else if (hasLimit && spent * 100 >= limit * WARNING_PERCENT) level = 'warning';

  return {
    limit,
    spent,
    remaining: limit - spent,
    percent,
    barPercent: Math.min(percent, 100), // a progress bar cannot go past full
    level,
  };
}

/**
 * Get the status of many budgets for one month.
 * @param {Array<{id: string, categoryId: string, monthlyLimit: number}>} budgets
 * @param {Array<object>} transactions
 * @param {{start: string, end: string}} range
 * @returns {Array<object>} Each item has budgetId, categoryId and the status fields.
 */
export function getBudgetStatuses(budgets, transactions, range) {
  return budgets.map((budget) => ({
    budgetId: budget.id,
    categoryId: budget.categoryId,
    ...getBudgetStatus(budget, calculateSpent(transactions, budget.categoryId, range)),
  }));
}
