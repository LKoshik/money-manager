/**
 * "Is this id used anywhere?" in ONE place. Accounts and categories are only deleted
 * when nothing points to them; otherwise they are archived.
 * A later phase that points at accounts or categories adds ONE [store, index] pair here.
 */

import { promisify } from './baseRepo.js';

/** Where an account id can be stored: [store, index]. */
export const ACCOUNT_REFERENCES = [
  ['transactions', 'accountId'],
  ['transactions', 'toAccountId'],
  ['recurring', 'accountId'],
  ['recurring', 'toAccountId'],
  ['loans', 'accountId'],
  ['repayments', 'accountId'],
];

/** Where a category id can be stored: [store, index]. */
export const CATEGORY_REFERENCES = [
  ['transactions', 'categoryId'],
  ['recurring', 'categoryId'],
];

/**
 * The store names a repo transaction must include to run isReferenced().
 * @param {Array<[string, string]>} pairs
 * @returns {string[]}
 */
export const referenceStores = (pairs) => [...new Set(pairs.map(([store]) => store))];

/**
 * Does any store point to this id?
 * @param {IDBTransaction} tx  Must cover referenceStores(pairs).
 * @param {Array<[string, string]>} pairs  ACCOUNT_REFERENCES or CATEGORY_REFERENCES.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function isReferenced(tx, pairs, id) {
  const counts = await Promise.all(pairs.map(([store, index]) => promisify(tx.objectStore(store).index(index).count(id))));
  return counts.some((count) => count > 0);
}
