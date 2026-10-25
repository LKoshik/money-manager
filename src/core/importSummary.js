/** Words for the result of a backup import (success counts or a list of problems). */

import { BACKUP_STORES } from './backupStores.js';

/**
 * Say what was imported.
 * @param {Object<string, number>} counts  Items imported per store.
 * @returns {string} Example: "2 accounts, 17 categories, 1 transaction, 0 budgets"
 */
export function summarizeImport(counts) {
  // Stores added in later versions are mentioned only when they hold something.
  return BACKUP_STORES.filter((store) => store.since === 1 || counts[store.name] > 0)
    .map(({ name, label: [one, many] }) => `${counts[name] ?? 0} ${counts[name] === 1 ? one : many}`)
    .join(', ');
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
