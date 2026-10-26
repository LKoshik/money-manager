/**
 * Validation for extra income (a gift, bonus, money from family). One entry = name, amount, date,
 * and a split of the FULL amount between the wishes pool and other buckets. Every entry is tied to ONE
 * income transaction of the main app (created with it, or linked), so the money is never counted twice.
 */

import { MAX_NAME_LENGTH } from './validate.js';
import { MAX_BUCKETS } from './validatePlans.js';
import { isObject, isText, isPaise, isDateText, collect } from './validateParts.js';

function validatePart(part) {
  if (!isObject(part)) return ['split part must be an object'];
  return collect([
    [isText(part.id), 'split part id is missing'],
    [isText(part.name) && part.name.length <= MAX_NAME_LENGTH, `split part name must be 1-${MAX_NAME_LENGTH} characters`],
    [isPaise(part.amount) && part.amount > 0, 'split part amount must be a positive whole number of paise'],
  ]);
}

/**
 * @param {unknown} entry
 * @returns {string[]} Problems found (empty if valid). The wishes part plus the bucket parts must equal the amount.
 */
export function validateExtraIncome(entry) {
  if (!isObject(entry)) return ['extra income must be an object'];
  const parts = Array.isArray(entry.buckets) ? entry.buckets : null;
  const problems = collect([
    [isText(entry.id), 'id is missing'],
    [isText(entry.name) && entry.name.length <= MAX_NAME_LENGTH, `name must be 1-${MAX_NAME_LENGTH} characters`],
    [isPaise(entry.amount) && entry.amount > 0, 'amount must be a positive whole number of paise'],
    [isDateText(entry.date), 'date must be an ISO date'],
    [isPaise(entry.wishes) && entry.wishes >= 0, 'wishes must be a whole number of paise, 0 or more'],
    [parts !== null && parts.length <= MAX_BUCKETS, `buckets must be a list of at most ${MAX_BUCKETS}`],
    [isText(entry.transactionId), 'transactionId is missing'],
    [isDateText(entry.createdAt), 'createdAt must be an ISO date'],
  ]);
  if (parts === null) return problems;
  const ids = new Set();
  let total = isPaise(entry.wishes) ? entry.wishes : 0;
  for (const part of parts) {
    problems.push(...validatePart(part));
    if (ids.has(part?.id)) problems.push('a split part id is used twice');
    ids.add(part?.id);
    if (isPaise(part?.amount)) total += part.amount;
  }
  if (isPaise(entry.amount) && total !== entry.amount) problems.push('the split must add up to the full amount');
  return problems;
}

/**
 * Backup check across the whole list: every entry points to an existing INCOME transaction, and no
 * transaction is used by two entries.
 * @param {object[]} extraIncomes  Already checked one by one.
 * @param {object[]} transactions
 * @param {string[]} errors  Problems are added here.
 */
export function checkExtraIncomeLinks(extraIncomes, transactions, errors) {
  const income = new Set(transactions.filter((txn) => txn.type === 'income').map((txn) => txn.id));
  const used = new Set();
  extraIncomes.forEach((entry, index) => {
    if (!income.has(entry.transactionId)) errors.push(`extraIncomes[${index}]: income transaction not found`);
    if (used.has(entry.transactionId)) errors.push(`extraIncomes[${index}]: transaction is used by another entry`);
    used.add(entry.transactionId);
  });
}
