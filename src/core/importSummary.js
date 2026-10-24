/** Words for the result of a backup import (success counts or a list of problems). */

const PARTS = [
  ['accounts', 'account', 'accounts'],
  ['categories', 'category', 'categories'],
  ['transactions', 'transaction', 'transactions'],
  ['budgets', 'budget', 'budgets'],
];

/**
 * Say what was imported.
 * @param {{accounts: number, categories: number, transactions: number, budgets: number}} counts
 * @returns {string} Example: "2 accounts, 17 categories, 1 transaction, 0 budgets"
 */
export function summarizeImport(counts) {
  return PARTS.map(([key, one, many]) => `${counts[key] ?? 0} ${counts[key] === 1 ? one : many}`).join(', ');
}

/**
 * Turn the problems of a bad backup file into a short list for a dialog.
 * @param {string[]} errors
 * @param {number} [max=5]  Longer lists are cut so the dialog stays readable.
 * @returns {string[]}
 */
export function summarizeProblems(errors, max = 5) {
  const lines = errors.slice(0, max);
  if (errors.length > max) lines.push(`...and ${errors.length - max} more problems.`);
  return lines;
}
