/** The form data of the Add repayment sheet. Pure. */

import { textToPaise } from './amountInput.js';
import { toLocalInputValue, fromLocalInputValue } from './dateInput.js';
import { selectableAccounts, pickDefaultAccount } from './transactionDraft.js';
import { checkNewRepayment } from './loanRules.js';

/**
 * @param {{loan: {accountId: string}, accounts: object[], now?: Date}} options
 * @returns {{amountText: string, accountId: string|null, dateLocal: string, note: string}}
 *   The account of the loan is the first choice, because money usually goes back the same way.
 */
export function createRepaymentDraft({ loan, accounts, now = new Date() }) {
  const usable = selectableAccounts(accounts);
  const accountId = usable.some((account) => account.id === loan.accountId) ? loan.accountId : pickDefaultAccount(accounts, null);
  return { amountText: '', accountId, dateLocal: toLocalInputValue(now.toISOString()), note: '' };
}

/**
 * Check the draft (including "not more than outstanding") and build the input.
 * @param {ReturnType<typeof createRepaymentDraft>} draft
 * @param {{id: string, amount: number}} loan
 * @param {Array<{amount: number}>} repayments  This loan's repayments so far.
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function repaymentDraftToInput(draft, loan, repayments) {
  const amount = textToPaise(draft.amountText);
  const problems = checkNewRepayment(loan, repayments, amount);
  if (!draft.accountId) problems.push('Pick an account.');
  const date = fromLocalInputValue(draft.dateLocal);
  if (!date) problems.push('Check the date and time.');
  return { input: { loanId: loan.id, amount, date, accountId: draft.accountId, note: draft.note.trim() }, problems };
}
