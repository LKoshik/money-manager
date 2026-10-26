/**
 * Extra income storage. Each entry is tied to ONE income transaction of the main app:
 * "create" makes that transaction in the SAME database transaction, "link" uses one already recorded.
 * So the money is never counted twice. Deleting an entry keeps the transaction (the money is real);
 * deleting the transaction deletes its entry (removeTransaction).
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { requireAccount } from './loanGuards.js';
import { cleanTransactionFields } from './transactionFields.js';
import { validateExtraIncome } from '../core/validateExtraIncome.js';
import { validateTransaction, normalizeText, assertValid } from '../core/validate.js';

const base = createBaseRepo('extraIncomes', validateExtraIncome);
const STORES = ['extraIncomes', 'transactions', 'accounts', 'categories'];

/** Make and check one entry. */
function buildEntry(input, { amount, date, transactionId }) {
  const entry = {
    id: crypto.randomUUID(),
    name: normalizeText(input.name ?? ''),
    amount,
    date,
    wishes: input.wishes,
    buckets: input.buckets.map(({ id, name, amount: part }) => ({ id, name: normalizeText(name), amount: part })),
    transactionId,
    createdAt: new Date().toISOString(),
  };
  assertValid('extraIncomes', validateExtraIncome(entry));
  return entry;
}

async function requireIncomeCategory(tx, categoryId) {
  const category = await promisify(tx.objectStore('categories').get(categoryId));
  if (!category || category.kind !== 'income') throw new Error('categories: income category not found');
}

export const extraIncomesRepo = {
  /**
   * List all entries, newest date first.
   * @returns {Promise<object[]>}
   */
  async list() {
    return (await base.getAll()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  },

  /**
   * Record new money: creates the income transaction AND the entry, together.
   * @param {{name: string, amount: number, date: string, accountId: string, categoryId: string,
   *   wishes: number, buckets: Array<{id: string, name: string, amount: number}>}} input  Paise. wishes + buckets = amount.
   * @returns {Promise<object>} The saved entry.
   */
  createWithTransaction(input) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const now = new Date().toISOString();
      const txn = { id: crypto.randomUUID(), ...cleanTransactionFields({ type: 'income', amount: input.amount, date: input.date, accountId: input.accountId, categoryId: input.categoryId, note: input.name }), createdAt: now, updatedAt: now };
      assertValid('transactions', validateTransaction(txn));
      await requireAccount(tx, txn.accountId);
      await requireIncomeCategory(tx, txn.categoryId);
      const entry = buildEntry(input, { amount: txn.amount, date: txn.date, transactionId: txn.id });
      await promisify(tx.objectStore('transactions').put(txn));
      await promisify(tx.objectStore('extraIncomes').put(entry));
      return entry;
    });
  },

  /**
   * Use an income transaction that is already recorded (amount and date come from it).
   * @param {{name: string, transactionId: string, wishes: number, buckets: object[]}} input
   * @returns {Promise<object>} The saved entry.
   */
  linkTransaction(input) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const txn = await promisify(tx.objectStore('transactions').get(input.transactionId));
      if (!txn || txn.type !== 'income') throw new Error('transactions: income transaction not found');
      if ((await promisify(tx.objectStore('extraIncomes').index('transactionId').count(txn.id))) > 0) throw new Error('This income is already used as extra income.');
      const entry = buildEntry(input, { amount: txn.amount, date: txn.date, transactionId: txn.id });
      await promisify(tx.objectStore('extraIncomes').put(entry));
      return entry;
    });
  },

  /**
   * Delete an entry. Its income transaction stays (the money really came).
   * @param {string} id
   * @returns {Promise<void>}
   */
  remove: base.remove,

  /**
   * Delete a transaction, and the extra income entry tied to it (if any), together.
   * @param {string} id  Transaction id.
   * @returns {Promise<void>}
   */
  removeTransaction(id) {
    return withTransaction(['transactions', 'extraIncomes'], 'readwrite', async (tx) => {
      const entries = tx.objectStore('extraIncomes');
      const keys = await promisify(entries.index('transactionId').getAllKeys(id));
      await promisify(tx.objectStore('transactions').delete(id));
      await Promise.all(keys.map((key) => promisify(entries.delete(key))));
    });
  },
};
