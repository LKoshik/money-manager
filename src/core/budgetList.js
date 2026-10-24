/**
 * Builds the rows of the Budgets screen (pure: no DOM, no storage).
 * A "row" is a category that HAS a budget, with its status for one month.
 * "Unbudgeted" are categories that can still get a new budget.
 */

import { calculateSpent, getBudgetStatus } from './budgets.js';
import { formatMoney } from './money.js';

/** Worst first: what needs attention should be at the top. */
const LEVEL_ORDER = { over: 0, warning: 1, ok: 2 };

const byName = (a, b) => a.name.localeCompare(b.name);

/**
 * Which categories may get a NEW budget: active expense categories without one.
 * (An archived category that already has a budget is not here; it stays a row.)
 * @param {Array<object>} categories
 * @param {Array<{categoryId: string}>} budgets
 * @returns {Array<object>} Categories, A-Z.
 */
export function getBudgetableCategories(categories, budgets) {
  const used = new Set(budgets.map((budget) => budget.categoryId));
  return categories
    .filter((category) => category.kind === 'expense' && !category.archived && !used.has(category.id))
    .sort(byName);
}

function sortRows(rows) {
  return rows.sort(
    (a, b) =>
      LEVEL_ORDER[a.status.level] - LEVEL_ORDER[b.status.level] ||
      b.status.percent - a.status.percent ||
      byName(a.category, b.category),
  );
}

function buildRows(categories, budgets, transactions, range) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const rows = [];
  for (const budget of budgets) {
    const category = byId.get(budget.categoryId);
    // A budget whose category is gone, or is not an expense category, cannot be shown.
    if (!category || category.kind !== 'expense') continue;
    const spent = calculateSpent(transactions, category.id, range);
    rows.push({ budget, category, archived: category.archived, status: getBudgetStatus(budget, spent) });
  }
  return sortRows(rows);
}

/**
 * Total of all shown budgets, as one status.
 * @param {Array<{status: {limit: number, spent: number}}>} rows
 * @returns {object|null} Same fields as getBudgetStatus, or null when there are no rows.
 */
export function summarizeRows(rows) {
  if (rows.length === 0) return null;
  const limit = rows.reduce((sum, row) => sum + row.status.limit, 0);
  const spent = rows.reduce((sum, row) => sum + row.status.spent, 0);
  return getBudgetStatus({ monthlyLimit: limit }, spent);
}

/**
 * Everything the Budgets screen needs for one month.
 * @param {{categories: object[], budgets: object[], transactions: object[]}} data
 * @param {{start: string, end: string}} range  The month.
 * @returns {{rows: Array<{budget: object, category: object, archived: boolean, status: object}>,
 *   unbudgeted: Array<{category: object, spent: number}>, summary: object|null}}
 */
export function buildBudgetList({ categories, budgets, transactions }, range) {
  const rows = buildRows(categories, budgets, transactions, range);
  const unbudgeted = getBudgetableCategories(categories, budgets).map((category) => ({
    category,
    spent: calculateSpent(transactions, category.id, range),
  }));
  return { rows, unbudgeted, summary: summarizeRows(rows) };
}

/**
 * Short text for what is left of a budget.
 * @param {{remaining: number}} status
 * @returns {string} Example: "₹1,200.00 left" or "Over by ₹300.00".
 */
export function formatRemaining(status) {
  return status.remaining >= 0 ? `${formatMoney(status.remaining)} left` : `Over by ${formatMoney(-status.remaining)}`;
}

/**
 * Short text "spent / limit".
 * @param {{spent: number, limit: number}} status
 * @returns {string} Example: "₹800.00 / ₹5,000.00".
 */
export function formatSpentOfLimit(status) {
  return `${formatMoney(status.spent)} / ${formatMoney(status.limit)}`;
}
