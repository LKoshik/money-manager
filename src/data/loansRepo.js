/** Loans storage (money lent to / borrowed from a person). Deleting a loan deletes its repayments in the SAME transaction. */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { requireAccount } from './loanGuards.js';
import { toIsoDate } from './transactionFields.js';
import { validateLoan } from '../core/validateLoans.js';
import { checkLoanAmount } from '../core/loanRules.js';
import { normalizeText, assertValid } from '../core/validate.js';

const base = createBaseRepo('loans', validateLoan);
const STORES = ['loans', 'repayments', 'accounts'];
const byCreatedAt = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

/** Keep only the fields a person can set. */
function cleanFields(input) {
  return {
    direction: input.direction,
    person: normalizeText(input.person ?? ''),
    amount: input.amount,
    date: toIsoDate(input.date),
    accountId: input.accountId,
    dueDate: toIsoDate(input.dueDate ?? null),
    note: normalizeText(input.note ?? ''),
  };
}

export const loansRepo = {
  /**
   * List all loans, oldest first.
   * @returns {Promise<object[]>}
   */
  async list() {
    return (await base.getAll()).sort(byCreatedAt);
  },

  getById: base.getById,

  /**
   * Create a loan.
   * @param {{direction: 'lent'|'borrowed', person: string, amount: number, date: string|Date, accountId: string,
   *   dueDate?: string|null, note?: string}} input  amount is positive paise.
   * @returns {Promise<object>} The saved loan.
   */
  create(input) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const loan = { id: crypto.randomUUID(), ...cleanFields(input), createdAt: new Date().toISOString() };
      assertValid('loans', validateLoan(loan));
      await requireAccount(tx, loan.accountId);
      await promisify(tx.objectStore('loans').put(loan));
      return loan;
    });
  },

  /**
   * Change a loan. The direction never changes (it would flip every repayment). The amount cannot go below what is repaid.
   * @param {string} id
   * @param {object} changes  Any field you can give to create(), except direction.
   * @returns {Promise<object>} The saved loan.
   */
  update(id, changes) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const loans = tx.objectStore('loans');
      const current = await promisify(loans.get(id));
      if (!current) throw new Error(`loans: item not found (${id})`);
      const merged = { ...current, ...cleanFields({ ...current, ...changes }), direction: current.direction, id };
      assertValid('loans', validateLoan(merged));
      assertValid('loans', checkLoanAmount(await promisify(tx.objectStore('repayments').index('loanId').getAll(id)), merged.amount));
      await requireAccount(tx, merged.accountId);
      await promisify(loans.put(merged));
      return merged;
    });
  },

  /**
   * Delete a loan AND all its repayments.
   * @param {string} id
   * @returns {Promise<void>}
   */
  remove(id) {
    return withTransaction(['loans', 'repayments'], 'readwrite', async (tx) => {
      const repayments = tx.objectStore('repayments');
      const keys = await promisify(repayments.index('loanId').getAllKeys(id));
      await promisify(tx.objectStore('loans').delete(id));
      await Promise.all(keys.map((key) => promisify(repayments.delete(key))));
    });
  },
};
