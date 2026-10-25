/** Checks the loan repos run INSIDE their database transaction (the stores must be part of it). */

import { promisify } from './baseRepo.js';

/**
 * Stop when the account does not exist, so a loan can never point to nothing.
 * @param {IDBTransaction} tx  Must include the "accounts" store.
 * @param {string} accountId
 * @returns {Promise<void>}
 */
export async function requireAccount(tx, accountId) {
  if (!(await promisify(tx.objectStore('accounts').get(accountId)))) throw new Error('accounts: item not found');
}
