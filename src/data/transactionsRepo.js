/**
 * Transactions storage (income, expense, transfer).
 * We load all transactions and let core/ filter them by date. This is fast
 * enough for personal use and keeps all date logic in one place.
 */

import { createBaseRepo } from './baseRepo.js';
import { validateTransaction } from '../core/validate.js';
import { cleanTransactionFields } from './transactionFields.js';

const base = createBaseRepo('transactions', validateTransaction);

export const transactionsRepo = {
  /**
   * Get every transaction (not sorted).
   * @returns {Promise<object[]>}
   */
  getAll: base.getAll,

  getById: base.getById,

  /**
   * Create a transaction.
   * @param {{type: string, amount: number, date: string|Date, accountId: string,
   *   toAccountId?: string, categoryId?: string, note?: string, tags?: string[], recurringId?: string|null}} input
   *   amount is a positive number of paise. For a transfer, give toAccountId and no category.
   * @returns {Promise<object>} The saved transaction.
   */
  async create(input) {
    const now = new Date().toISOString();
    return base.put({
      id: crypto.randomUUID(),
      ...cleanTransactionFields(input),
      createdAt: now,
      updatedAt: now,
    });
  },

  /**
   * Change a transaction. Sets updatedAt.
   * @param {string} id
   * @param {object} changes  Any of the fields you can give to create().
   * @returns {Promise<object>}
   */
  async update(id, changes) {
    const current = await base.getById(id);
    if (!current) throw new Error(`transactions: item not found (${id})`);
    return base.put({
      ...current,
      ...cleanTransactionFields({ ...current, ...changes }),
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Delete a transaction for good. (Transactions can be hard-deleted.)
   * @param {string} id
   * @returns {Promise<void>}
   */
  remove: base.remove,
};
