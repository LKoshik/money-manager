/** The form data of the extra income sheet: a draft into the repository input. Pure. */

import { MAX_NAME_LENGTH } from './validate.js';
import { textToPaise } from './amountInput.js';
import { fromLocalInputValue, toLocalInputValue } from './dateInput.js';
import { splitRemainder } from './extraIncome.js';

/**
 * @param {Array<{id: string, name: string}>} buckets  The buckets of the plan running now (the split rows).
 * @param {Date} [now=new Date()]
 * @returns {{mode: 'new'|'link', name: string, amountText: string, dateLocal: string, accountId: string|null,
 *   categoryId: string|null, transactionId: string|null, rows: Array<{id: string, name: string, amountText: string}>}}
 */
export function createExtraDraft(buckets, now = new Date()) {
  return {
    mode: 'new',
    name: '',
    amountText: '',
    dateLocal: toLocalInputValue(now.toISOString()),
    accountId: null,
    categoryId: null,
    transactionId: null,
    rows: buckets.map((bucket) => ({ id: bucket.id, name: bucket.name, amountText: '' })),
  };
}

const paise = (text) => Math.max(0, textToPaise(text) ?? 0);

/**
 * The full amount of the draft: typed (new) or taken from the linked transaction (link).
 * @param {object} draft
 * @param {Array<{id: string, amount: number}>} [transactions]
 * @returns {number} Paise (0 when nothing is chosen yet).
 */
export function draftAmount(draft, transactions = []) {
  if (draft.mode === 'link') return transactions.find((txn) => txn.id === draft.transactionId)?.amount ?? 0;
  return paise(draft.amountText);
}

/** @returns {{wishes: number, overBy: number}} The live split while typing. */
export const draftSplit = (draft, transactions = []) =>
  splitRemainder(draftAmount(draft, transactions), draft.rows.map((row) => paise(row.amountText)));

/**
 * Check the draft and build what the repository needs.
 * @param {object} draft
 * @param {object[]} transactions  All transactions (to read a linked one).
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function extraDraftToInput(draft, transactions = []) {
  const problems = [];
  const name = draft.name.trim();
  if (!name) problems.push('Give this income a name.');
  else if (name.length > MAX_NAME_LENGTH) problems.push(`Use at most ${MAX_NAME_LENGTH} letters for the name.`);
  const amount = draftAmount(draft, transactions);
  const date = draft.mode === 'new' ? fromLocalInputValue(draft.dateLocal) : null;
  if (draft.mode === 'link') {
    if (!draft.transactionId) problems.push('Choose the income you already recorded.');
  } else {
    if (amount <= 0) problems.push('Enter an amount above zero.');
    if (!date) problems.push('Check the date.');
    if (!draft.accountId) problems.push('Choose an account.');
    if (!draft.categoryId) problems.push('Choose a category.');
  }
  const split = draftSplit(draft, transactions);
  if (split.overBy > 0) problems.push('The buckets take more than the full amount.');
  const buckets = draft.rows.filter((row) => paise(row.amountText) > 0).map((row) => ({ id: row.id, name: row.name, amount: paise(row.amountText) }));
  const input = { name, wishes: split.wishes, buckets };
  if (draft.mode === 'link') return { input: { ...input, transactionId: draft.transactionId }, problems };
  return { input: { ...input, amount, date, accountId: draft.accountId, categoryId: draft.categoryId }, problems };
}
