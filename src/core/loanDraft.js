/** The form data of the New loan sheet: a draft while typing, and the checked input to save. Pure. */

import { MAX_PERSON_LENGTH } from './validateLoans.js';
import { textToPaise } from './amountInput.js';
import { toLocalInputValue, fromLocalInputValue } from './dateInput.js';
import { pickDefaultAccount, hasAmount } from './transactionDraft.js';

/**
 * @param {{direction?: 'lent'|'borrowed', accounts?: object[], lastAccountId?: string|null, now?: Date}} [options]
 * @returns {{direction: string, person: string, amountText: string, accountId: string|null,
 *   dateLocal: string, dueDay: string, note: string}}  dueDay is "YYYY-MM-DD" or "" (no due date).
 */
export function createLoanDraft({ direction = 'lent', accounts = [], lastAccountId = null, now = new Date() } = {}) {
  return {
    direction,
    person: '',
    amountText: '',
    accountId: pickDefaultAccount(accounts, lastAccountId),
    dateLocal: toLocalInputValue(now.toISOString()),
    dueDay: '',
    note: '',
  };
}

/**
 * Check the draft and build the repository input.
 * @param {ReturnType<typeof createLoanDraft>} draft
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function loanDraftToInput(draft) {
  const person = draft.person.trim();
  const problems = [];
  if (!person) problems.push('Who is it? Enter a name.');
  else if (person.length > MAX_PERSON_LENGTH) problems.push(`Use at most ${MAX_PERSON_LENGTH} letters for the name.`);
  if (!hasAmount(draft.amountText)) problems.push('Enter an amount greater than zero.');
  if (!draft.accountId) problems.push('Pick an account.');
  const date = fromLocalInputValue(draft.dateLocal);
  if (!date) problems.push('Check the date and time.');
  // 12:00 local keeps the due day stable in every time zone.
  const dueDate = draft.dueDay ? fromLocalInputValue(`${draft.dueDay}T12:00`) : null;
  if (draft.dueDay && !dueDate) problems.push('Check the due date.');
  const input = { direction: draft.direction, person, amount: textToPaise(draft.amountText), date, accountId: draft.accountId, dueDate, note: draft.note.trim() };
  return { input, problems };
}
