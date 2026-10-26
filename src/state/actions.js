/**
 * Actions: the ONLY place that changes data. Each action saves through a
 * repository, then reloads the affected lists into the store, so every
 * screen redraws with fresh data. Screens never talk to data/ directly.
 */

import { LOADERS, refresh, action } from './loaders.js';
import { accountsRepo } from '../data/accountsRepo.js';
import { categoriesRepo } from '../data/categoriesRepo.js';
import { transactionsRepo } from '../data/transactionsRepo.js';
import { budgetsRepo } from '../data/budgetsRepo.js';
import { extraIncomesRepo } from '../data/extraIncomesRepo.js';
import { settingsRepo } from '../data/settingsRepo.js';
import { seedIfFirstLaunch } from '../data/seed.js';
import { requestPersistentStorage } from '../data/db.js';
import { getStorageProtection } from '../data/storage.js';
import { importBackup, markBackupDone, createBackupFile, createCsvFile } from '../data/backup.js';

/**
 * Start the app's data: add default categories on first launch, ask the
 * browser to protect our storage, and load everything into the store.
 * @returns {Promise<void>}
 */
export async function initApp() {
  await seedIfFirstLaunch();
  requestPersistentStorage(); // not awaited: it never fails and should not delay start
  await refresh(Object.keys(LOADERS));
}

/** Add a transaction. @param {object} input See transactionsRepo.create. */
export const addTransaction = action(['transactions'], (input) => transactionsRepo.create(input));

/** Change a transaction. @param {string} id @param {object} changes */
export const updateTransaction = action(['transactions'], (id, changes) => transactionsRepo.update(id, changes));

/** Delete a transaction for good (an extra income entry tied to it goes too). @param {string} id */
export const deleteTransaction = action(['transactions', 'extraIncomes'], (id) => extraIncomesRepo.removeTransaction(id));

/** Add an account. @param {object} input See accountsRepo.create. */
export const addAccount = action(['accounts'], (input) => accountsRepo.create(input));

/** Change an account. @param {string} id @param {object} changes */
export const updateAccount = action(['accounts'], (id, changes) => accountsRepo.update(id, changes));

/** Delete an account, or archive it if it has transactions. @param {string} id @returns {Promise<'deleted'|'archived'>} */
export const removeAccount = action(['accounts'], (id) => accountsRepo.removeOrArchive(id));

/** Add a category. @param {object} input See categoriesRepo.create. */
export const addCategory = action(['categories'], (input) => categoriesRepo.create(input));

/** Change a category. @param {string} id @param {object} changes */
export const updateCategory = action(['categories'], (id, changes) => categoriesRepo.update(id, changes));

/** Delete a category, or archive it if it has transactions. @param {string} id @returns {Promise<'deleted'|'archived'>} */
export const removeCategory = action(['categories', 'budgets'], (id) => categoriesRepo.removeOrArchive(id));

/** Set the monthly limit of a category. @param {string} categoryId @param {number} monthlyLimit Paise. */
export const setBudgetLimit = action(['budgets'], (categoryId, monthlyLimit) => budgetsRepo.setLimit(categoryId, monthlyLimit));

/** Delete a budget. @param {string} id */
export const removeBudget = action(['budgets'], (id) => budgetsRepo.remove(id));

/** Choose the theme. @param {'light'|'dark'|null} theme null means follow the phone. */
export const setTheme = action(['settings'], (theme) => settingsRepo.set('theme', theme));

/** Remember the account of the last new transaction. @param {string} accountId */
export const rememberAccount = action(['settings'], (accountId) => settingsRepo.set('lastAccountId', accountId));

/** Remember that a backup file was just saved. */
export const recordBackup = action(['settings'], () => markBackupDone());

/** Replace all data with a backup file. @param {string} text The JSON text. @returns {Promise<object>} Counts of imported items. */
export const importData = action(Object.keys(LOADERS), (text) => importBackup(text));

/** Thrown by importData when the file is not a valid backup. "errors" lists the problems. */
export { BackupError } from '../data/backup.js';

/** Make the JSON backup file text. Does not change the last-backup date. @returns {Promise<{filename: string, mime: string, text: string}>} */
export const exportBackupFile = () => createBackupFile();

/** Make the CSV file of all transactions. @returns {Promise<{filename: string, mime: string, text: string}>} */
export const exportCsvFile = () => createCsvFile();

/** Is the browser keeping our data safe? @returns {Promise<'protected'|'unprotected'|'unsupported'>} */
export const checkStorage = () => getStorageProtection();

/** Ask the browser to protect our data, then say how it went. @returns {Promise<'protected'|'unprotected'|'unsupported'>} */
export async function protectStorage() {
  await requestPersistentStorage();
  return getStorageProtection();
}

// Recurring rules live in their own file to keep this one short.
export * from './recurringActions.js';

// Goals live in their own file too.
export * from './goalActions.js';

// Lent / borrowed money lives in its own file too.
export * from './loanActions.js';

// The planner lives in its own file too.
export * from './planActions.js';
export * from './extraIncomeActions.js';
