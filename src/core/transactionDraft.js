/**
 * The Add / Edit transaction form, as pure logic. A "draft" is what the form
 * holds while the person is still typing. draftToInput() checks it and
 * turns it into the data the repository wants, with problems in simple words.
 */

import { textToPaise, paiseToText } from './amountInput.js';
import { toLocalInputValue, fromLocalInputValue } from './dateInput.js';

/**
 * Accounts the person may pick: active ones, plus any the draft already uses.
 * @param {object[]} accounts
 * @param {Array<string|null>} [keepIds]  Archived accounts to keep (when editing an old transaction).
 * @returns {object[]}
 */
export function selectableAccounts(accounts, keepIds = []) {
  return accounts.filter((account) => !account.archived || keepIds.includes(account.id));
}

/**
 * Categories for one transaction type (income or expense).
 * @param {object[]} categories
 * @param {string} type
 * @param {string|null} [keepId]  An archived category to keep (when editing).
 * @returns {object[]}
 */
export function selectableCategories(categories, type, keepId = null) {
  return categories.filter((category) => category.kind === type && (!category.archived || category.id === keepId));
}

/**
 * Choose the account to start with.
 * @param {object[]} accounts
 * @param {string|null} lastAccountId  The account used last time.
 * @param {string|null} [exceptId]  An account that must not be chosen.
 * @returns {string|null} The last used one if it is still active, else the first active one.
 */
export function pickDefaultAccount(accounts, lastAccountId, exceptId = null) {
  const active = accounts.filter((account) => !account.archived && account.id !== exceptId);
  return active.find((account) => account.id === lastAccountId)?.id ?? active[0]?.id ?? null;
}

/**
 * Make the starting draft.
 * @param {{transaction?: object|null, accounts?: object[], lastAccountId?: string|null, now?: Date}} options
 *   Give a transaction to edit it; give none to add a new one.
 * @returns {object}
 */
export function createDraft({ transaction = null, accounts = [], lastAccountId = null, now = new Date() } = {}) {
  if (transaction) {
    return {
      type: transaction.type,
      amountText: paiseToText(transaction.amount),
      categoryId: transaction.categoryId ?? null,
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId ?? null,
      dateLocal: toLocalInputValue(transaction.date),
      dateOriginal: transaction.date, // kept so an untouched date keeps its seconds
      note: transaction.note,
      tags: [...transaction.tags],
    };
  }
  return {
    type: 'expense',
    amountText: '',
    categoryId: null,
    accountId: pickDefaultAccount(accounts, lastAccountId),
    toAccountId: null,
    dateLocal: toLocalInputValue(now.toISOString()),
    dateOriginal: null,
    note: '',
    tags: [],
  };
}

/**
 * Switch between expense, income and transfer.
 * @param {object} draft
 * @param {string} type
 * @param {object[]} accounts
 * @returns {object} A new draft. The category is cleared: a category belongs to one kind.
 */
export function changeDraftType(draft, type, accounts) {
  if (type === draft.type) return draft;
  const toAccountId = type === 'transfer' ? pickDefaultAccount(accounts, null, draft.accountId) : null;
  return { ...draft, type, categoryId: null, toAccountId };
}

/**
 * Is there an amount above zero?
 * @param {string} amountText
 * @returns {boolean}
 */
export function hasAmount(amountText) {
  const paise = textToPaise(amountText);
  return paise !== null && paise > 0;
}

function transferProblems(draft) {
  if (!draft.toAccountId) return ['Pick the account the money goes to.'];
  if (draft.accountId && draft.toAccountId === draft.accountId) return ['Choose two different accounts.'];
  return [];
}

function resolveDate(draft) {
  const unchanged = draft.dateOriginal && draft.dateLocal === toLocalInputValue(draft.dateOriginal);
  return unchanged ? draft.dateOriginal : fromLocalInputValue(draft.dateLocal);
}

/**
 * Check the draft and build the repository input.
 * @param {object} draft
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function draftToInput(draft) {
  const problems = [];
  const amount = textToPaise(draft.amountText);
  const isTransfer = draft.type === 'transfer';
  if (!hasAmount(draft.amountText)) problems.push('Enter an amount greater than zero.');
  if (!isTransfer && !draft.categoryId) problems.push('Pick a category.');
  if (!draft.accountId) problems.push(isTransfer ? 'Pick the account the money comes from.' : 'Pick an account.');
  if (isTransfer) problems.push(...transferProblems(draft));
  const date = resolveDate(draft);
  if (!date) problems.push('Check the date and time.');
  const input = {
    type: draft.type,
    amount,
    date,
    accountId: draft.accountId,
    toAccountId: isTransfer ? draft.toAccountId : null,
    categoryId: isTransfer ? null : draft.categoryId,
    note: draft.note.trim(),
    tags: draft.tags,
  };
  return { input, problems };
}
