/** Rules about repayments and loan changes. Pure, so the data layer and the screens use the SAME check. */

import { outstandingOf, repaidAmount } from './loanModel.js';
import { formatMoney } from './money.js';

/**
 * Can this amount be repaid now?
 * @param {{amount: number}} loan
 * @param {Array<{amount: number}>} repayments  The loan's repayments so far.
 * @param {number|null} amount  Paise.
 * @returns {string[]} Problems in simple words (empty if fine).
 */
export function checkNewRepayment(loan, repayments, amount) {
  const left = outstandingOf(loan, repayments);
  if (left <= 0) return ['This loan is already settled.'];
  if (!Number.isSafeInteger(amount) || amount <= 0) return ['Enter an amount greater than zero.'];
  if (amount > left) return [`Only ${formatMoney(left)} is still outstanding.`];
  return [];
}

/**
 * Can the loan amount be changed to this value?
 * @param {Array<{amount: number}>} repayments
 * @param {number} newAmount  Paise.
 * @returns {string[]}
 */
export function checkLoanAmount(repayments, newAmount) {
  const repaid = repaidAmount(repayments);
  return newAmount < repaid ? [`${formatMoney(repaid)} is already repaid, so the loan cannot be smaller.`] : [];
}
