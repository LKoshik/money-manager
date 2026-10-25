/**
 * Recurring rules storage, and the generator that turns due rules into transactions.
 * generate() runs the ATOMIC generator of recurringGenerate.js.
 */

import { createBaseRepo, withTransaction, promisify, putAll } from './baseRepo.js';
import { toIsoDate } from './transactionFields.js';
import { generateInside } from './recurringGenerate.js';
import { validateRecurring } from '../core/validateRecurring.js';
import { normalizeText, assertValid } from '../core/validate.js';
import { skipToNext } from '../core/recurrence.js';

const base = createBaseRepo('recurring', validateRecurring);
const byCreatedAt = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

/** Keep only the fields we store, and fix fields that do not fit the type. */
function cleanRuleFields(input) {
  const isTransfer = input.type === 'transfer';
  return {
    type: input.type,
    amount: input.amount,
    accountId: input.accountId,
    toAccountId: isTransfer ? input.toAccountId : null,
    categoryId: isTransfer ? null : input.categoryId,
    note: normalizeText(input.note ?? ''),
    frequency: input.frequency,
    startDate: toIsoDate(input.startDate),
    endDate: input.endDate ? toIsoDate(input.endDate) : null,
    active: input.active ?? true,
  };
}

const GENERATE_STORES = ['recurring', 'transactions', 'accounts', 'categories'];
const scheduleChanged = (a, b) => a.startDate !== b.startDate || a.frequency !== b.frequency;

export const recurringRepo = {
  /**
   * List all rules, oldest first.
   * @returns {Promise<object[]>}
   */
  async list() {
    return (await base.getAll()).sort(byCreatedAt);
  },

  getById: base.getById,

  /**
   * Create a rule. It creates nothing by itself: call generate() afterwards.
   * @param {{type: string, amount: number, accountId: string, toAccountId?: string, categoryId?: string,
   *   note?: string, frequency: string, startDate: string, endDate?: string|null}} input  Amount in paise.
   * @returns {Promise<object>} The saved rule.
   */
  create(input) {
    return base.put({
      id: crypto.randomUUID(),
      ...cleanRuleFields(input),
      generatedCount: 0,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Change a rule. A changed start date or frequency, or resuming a paused rule,
   * continues from the next occurrence (nothing from the past is added).
   * @param {string} id
   * @param {object} changes  Any field you can give to create(), or "active".
   * @param {Date} [now=new Date()]
   * @returns {Promise<object>}
   */
  update(id, changes, now = new Date()) {
    return withTransaction(['recurring'], 'readwrite', async (tx) => {
      const store = tx.objectStore('recurring');
      const current = await promisify(store.get(id));
      if (!current) throw new Error(`recurring: item not found (${id})`);
      const merged = { ...current, ...cleanRuleFields({ ...current, ...changes }) };
      if (scheduleChanged(current, merged) || (!current.active && merged.active)) {
        merged.generatedCount = skipToNext({ ...merged, generatedCount: 0 }, now);
      }
      assertValid('recurring', validateRecurring(merged));
      await promisify(store.put(merged));
      return merged;
    });
  },

  /** Delete a rule. Transactions it already made stay. @param {string} id @returns {Promise<void>} */
  remove: base.remove,

  /**
   * Create the due transactions of one rule (safe to call twice).
   * @param {string} ruleId
   * @param {Date} [now=new Date()]
   * @returns {Promise<number>} How many transactions were created (0 if blocked, paused or nothing due).
   */
  generate: (ruleId, now = new Date()) =>
    withTransaction(GENERATE_STORES, 'readwrite', (tx) => generateInside(tx, ruleId, now)),

  /**
   * Run every active rule.
   * @param {Date} [now=new Date()]
   * @returns {Promise<number>} Total transactions created.
   */
  async generateAll(now = new Date()) {
    let total = 0;
    for (const rule of await base.getAll()) {
      if (rule.active) total += await recurringRepo.generate(rule.id, now);
    }
    return total;
  },

  /**
   * Move every active rule to its next occurrence after "now" (used when the
   * feature is switched ON, so nothing from the OFF period is added).
   * @param {Date} [now=new Date()]
   * @returns {Promise<void>}
   */
  skipAll(now = new Date()) {
    return withTransaction(['recurring'], 'readwrite', async (tx) => {
      const store = tx.objectStore('recurring');
      for (const rule of await promisify(store.getAll())) {
        const generatedCount = skipToNext(rule, now);
        if (rule.active && generatedCount !== rule.generatedCount) await promisify(store.put({ ...rule, generatedCount }));
      }
    });
  },
};
