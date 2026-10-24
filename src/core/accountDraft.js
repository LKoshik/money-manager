/**
 * The account form as pure logic. For a credit card the person types the
 * amount they OWE as a normal positive number; we store it as a negative
 * opening balance, because that is how balances are calculated.
 */

import { ACCOUNT_TYPES, MAX_NAME_LENGTH } from './validate.js';
import { textToPaise, paiseToText } from './amountInput.js';

/**
 * @param {string} type  An account type.
 * @returns {string} The label of the balance box.
 */
export function balanceLabel(type) {
  return type === 'credit' ? 'Amount you owe' : 'Opening balance';
}

/**
 * Make the starting draft of the account form.
 * @param {object|null} [account]  Give an account to edit it.
 * @returns {{name: string, type: string, balanceText: string}}
 */
export function createAccountDraft(account = null) {
  if (!account) return { name: '', type: 'cash', balanceText: '' };
  const shown = account.type === 'credit' ? -account.openingBalance : account.openingBalance;
  return { name: account.name, type: account.type, balanceText: shown === 0 ? '' : paiseToText(shown) };
}

/**
 * Check the draft and build the repository input.
 * @param {{name: string, type: string, balanceText: string}} draft
 * @returns {{input: {name: string, type: string, openingBalance: number}, problems: string[]}}
 */
export function accountDraftToInput(draft) {
  const problems = [];
  const name = draft.name.trim();
  if (!name) problems.push('Give the account a name.');
  else if (name.length > MAX_NAME_LENGTH) problems.push(`Use at most ${MAX_NAME_LENGTH} letters for the name.`);
  if (!ACCOUNT_TYPES.includes(draft.type)) problems.push('Choose a type.');
  const typed = draft.balanceText === '' ? 0 : textToPaise(draft.balanceText);
  if (typed === null || typed < 0) problems.push('Enter a valid amount, or leave it empty.');
  const amount = typed ?? 0;
  // "+ 0" turns -0 into 0, so a zero balance never shows as "-0".
  const openingBalance = (draft.type === 'credit' ? -amount : amount) + 0;
  return { input: { name, type: draft.type, openingBalance }, problems };
}
