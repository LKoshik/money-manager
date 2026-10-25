/** How the store lists are loaded from the database, and the helpers every action file uses. */

import { store } from './store.js';
import { accountsRepo } from '../data/accountsRepo.js';
import { categoriesRepo } from '../data/categoriesRepo.js';
import { transactionsRepo } from '../data/transactionsRepo.js';
import { budgetsRepo } from '../data/budgetsRepo.js';
import { recurringRepo } from '../data/recurringRepo.js';
import { goalsRepo } from '../data/goalsRepo.js';
import { contributionsRepo } from '../data/contributionsRepo.js';
import { loansRepo } from '../data/loansRepo.js';
import { repaymentsRepo } from '../data/repaymentsRepo.js';
import { settingsRepo } from '../data/settingsRepo.js';

/** One loader per store list. A new store adds ONE line. */
export const LOADERS = {
  accounts: () => accountsRepo.list({ includeArchived: true }),
  categories: () => categoriesRepo.list({ includeArchived: true }),
  transactions: () => transactionsRepo.getAll(),
  budgets: () => budgetsRepo.list(),
  recurring: () => recurringRepo.list(),
  goals: () => goalsRepo.list(),
  contributions: () => contributionsRepo.list(),
  loans: () => loansRepo.list(),
  repayments: () => repaymentsRepo.list(),
  settings: () => settingsRepo.getAll(),
};

/**
 * Reload some lists from the database into the store.
 * @param {string[]} keys  Names from LOADERS.
 * @returns {Promise<void>}
 */
export async function refresh(keys) {
  const values = await Promise.all(keys.map((key) => LOADERS[key]()));
  store.setState(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
}

/**
 * Make an action: run the work, then refresh the lists it changed.
 * @param {string[]} keys
 * @param {(...args: any[]) => Promise<any>} work
 * @returns {(...args: any[]) => Promise<any>}
 */
export function action(keys, work) {
  return async (...args) => {
    const result = await work(...args);
    await refresh(keys);
    return result;
  };
}
