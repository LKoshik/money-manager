/**
 * Transactions storage (income, expense, transfer).
 * We load all transactions and let core/ filter them by date. This is fast
 * enough for personal use and keeps all date logic in one place.
 */

import { createBaseRepo } from './baseRepo.js';
import { validateTransaction, normalizeText } from '../core/validate.js';

const base = createBaseRepo('transactions', validateTransaction);

/** Turn any date input into one standard ISO string. A bad date is left as it is, so validation reports it. */
function toIsoDate(value) {
  if (value == null) return value; // new Date(null) would silently become 1970
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

/** Keep only the fields we store, and fix fields that do not fit the type. */
function cleanFields(input) {
  const isTransfer = input.type === 'transfer';
  return {
    type: input.type,
    amount: input.amount,
    date: toIsoDate(input.date),
    accountId: input.accountId,
    toAccountId: isTransfer ? input.toAccountId : null,
    categoryId: isTransfer ? null : input.categoryId,
    note: normalizeText(input.note ?? ''),
    tags: input.tags ?? [],
  };
}

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
   *   toAccountId?: string, categoryId?: string, note?: string, tags?: string[]}} input
   *   amount is a positive number of paise. For a transfer, give toAccountId and no category.
   * @returns {Promise<object>} The saved transaction.
   */
  async create(input) {
    const now = new Date().toISOString();
    return base.put({
      id: crypto.randomUUID(),
      ...cleanFields(input),
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
      ...cleanFields({ ...current, ...changes }),
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
