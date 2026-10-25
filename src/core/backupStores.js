/**
 * THE list of stores inside a backup file. Backup export, import, validation and
 * the import summary all read this one table. A new phase adds ONE line here.
 * "since" = the schemaVersion in which the store first existed: an older file
 * does not have it, and its list counts as empty.
 */

import { validateAccount, validateCategory, validateTransaction, validateBudget } from './validate.js';
import { validateRecurring } from './validateRecurring.js';
import { validateGoal, validateContribution } from './validateGoals.js';
import { validateLoan, validateRepayment } from './validateLoans.js';

export const BACKUP_STORES = [
  { name: 'accounts', validator: validateAccount, since: 1, label: ['account', 'accounts'] },
  { name: 'categories', validator: validateCategory, since: 1, label: ['category', 'categories'] },
  { name: 'transactions', validator: validateTransaction, since: 1, label: ['transaction', 'transactions'] },
  { name: 'budgets', validator: validateBudget, since: 1, label: ['budget', 'budgets'] },
  { name: 'recurring', validator: validateRecurring, since: 2, label: ['recurring rule', 'recurring rules'] },
  { name: 'goals', validator: validateGoal, since: 3, label: ['goal', 'goals'] },
  { name: 'contributions', validator: validateContribution, since: 3, label: ['goal contribution', 'goal contributions'] },
  { name: 'loans', validator: validateLoan, since: 4, label: ['loan', 'loans'] },
  { name: 'repayments', validator: validateRepayment, since: 4, label: ['repayment', 'repayments'] },
];

/** @returns {string[]} The store names, in table order. */
export const backupStoreNames = () => BACKUP_STORES.map((store) => store.name);

/**
 * The stores a file of this version is supposed to contain.
 * @param {number} schemaVersion
 * @returns {typeof BACKUP_STORES}
 */
export const storesInFile = (schemaVersion) => BACKUP_STORES.filter((store) => store.since <= schemaVersion);

/**
 * Every list of a backup, with the missing (newer) ones as empty lists.
 * @param {{schemaVersion: number, data: object}} backup  Already checked by validateBackup.
 * @returns {Object<string, object[]>}
 */
export function listsOf(backup) {
  const present = new Set(storesInFile(backup.schemaVersion).map((store) => store.name));
  return Object.fromEntries(BACKUP_STORES.map(({ name }) => [name, present.has(name) ? backup.data[name] : []]));
}
