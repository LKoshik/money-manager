/** Cleaning of transaction fields, shared by the transactions repo and the recurring generator. */

import { normalizeText } from '../core/validate.js';

/**
 * Turn any date input into one standard ISO string. A bad date is left as it is, so validation reports it.
 * @param {string|Date|null|undefined} value
 * @returns {string|null|undefined|Date}
 */
export function toIsoDate(value) {
  if (value == null) return value; // new Date(null) would silently become 1970
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

/**
 * Keep only the fields we store, and fix fields that do not fit the type.
 * @param {object} input  A transaction-like object.
 * @returns {object}
 */
export function cleanTransactionFields(input) {
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
    recurringId: input.recurringId ?? null, // old transactions have none
  };
}
