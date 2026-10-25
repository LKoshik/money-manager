/**
 * Repayments storage. The rule "not more than outstanding" is checked INSIDE the database
 * transaction, so two quick taps cannot break it.
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { requireAccount } from './loanGuards.js';
import { toIsoDate } from './transactionFields.js';
import { validateRepayment } from '../core/validateLoans.js';
import { checkNewRepayment } from '../core/loanRules.js';
import { outstandingOf } from '../core/loanModel.js';
import { normalizeText, assertValid } from '../core/validate.js';

const base = createBaseRepo('repayments', validateRepayment);

export const repaymentsRepo = {
  /**
   * List all repayments of all loans.
   * @returns {Promise<object[]>}
   */
  list: base.getAll,

  /**
   * Add a repayment. It cannot be more than what is still outstanding.
   * @param {{loanId: string, amount: number, date?: string|Date, accountId: string, note?: string}} input  amount is positive paise.
   * @returns {Promise<{repayment: object, settled: boolean}>} settled = the loan is fully repaid now.
   */
  add(input) {
    return withTransaction(['loans', 'repayments', 'accounts'], 'readwrite', async (tx) => {
      const repayments = tx.objectStore('repayments');
      const loan = await promisify(tx.objectStore('loans').get(input.loanId));
      if (!loan) throw new Error('loans: item not found');
      const existing = await promisify(repayments.index('loanId').getAll(loan.id));
      assertValid('repayment', checkNewRepayment(loan, existing, input.amount));
      const repayment = {
        id: crypto.randomUUID(),
        loanId: loan.id,
        amount: input.amount,
        date: toIsoDate(input.date ?? new Date()),
        accountId: input.accountId,
        note: normalizeText(input.note ?? ''),
      };
      assertValid('repayment', validateRepayment(repayment));
      await requireAccount(tx, repayment.accountId);
      await promisify(repayments.put(repayment));
      return { repayment, settled: outstandingOf(loan, [...existing, repayment]) === 0 };
    });
  },

  /**
   * Delete one repayment (the loan simply has more outstanding again).
   * @param {string} id
   * @returns {Promise<void>}
   */
  remove: base.remove,
};
