/** The generator: turns the due occurrences of a rule into real transactions. */

import { promisify, putAll } from './baseRepo.js';
import { cleanTransactionFields } from './transactionFields.js';
import { validateTransaction, assertValid } from '../core/validate.js';
import { dueOccurrences } from '../core/recurrence.js';
import { blockedReason } from '../core/recurrenceStatus.js';

const byId = (items) => new Map(items.map((item) => [item.id, item]));

/** The transaction a rule creates for one date. */
function makeTransaction(rule, date, nowIso) {
  return {
    id: crypto.randomUUID(),
    ...cleanTransactionFields({ ...rule, date, tags: [], recurringId: rule.id }),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * Create the due transactions of one rule inside an open database transaction.
 * It re-reads the rule, creates the transactions AND bumps generatedCount in that
 * same transaction, so two tabs or a crash can never create the same one twice.
 * @param {IDBTransaction} tx  Must cover recurring, transactions, accounts, categories.
 * @param {string} ruleId
 * @param {Date} now
 * @returns {Promise<number>} How many transactions were created.
 */
export async function generateInside(tx, ruleId, now) {
  const rules = tx.objectStore('recurring');
  const rule = await promisify(rules.get(ruleId)); // read again: another tab may have run already
  if (!rule || !rule.active) return 0;
  const dates = dueOccurrences(rule, now);
  if (dates.length === 0) return 0;
  const [accounts, categories] = await Promise.all([
    promisify(tx.objectStore('accounts').getAll()),
    promisify(tx.objectStore('categories').getAll()),
  ]);
  if (blockedReason(rule, byId(accounts), byId(categories))) return 0;
  const items = dates.map((date) => makeTransaction(rule, date, now.toISOString()));
  items.forEach((item) => assertValid('transactions', validateTransaction(item)));
  await putAll(tx.objectStore('transactions'), items);
  await promisify(rules.put({ ...rule, generatedCount: rule.generatedCount + items.length }));
  return items.length;
}

