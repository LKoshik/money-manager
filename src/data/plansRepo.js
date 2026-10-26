/**
 * Planner storage: the plan is a list of VERSIONS ("applies from month X").
 * There is deliberately NO plain update or delete here: a change adds or replaces the version of one
 * FUTURE month (rules in core/planChanges.js), so the current and past months can never change.
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { validatePlan } from '../core/validatePlans.js';
import { saveTarget, scheduledIds, STOP_INPUT } from '../core/planChanges.js';
import { assertValid } from '../core/validate.js';

const base = createBaseRepo('plans', validatePlan);

/** Write one version. Runs INSIDE a transaction on the plans store. */
async function writeVersion(store, input, now) {
  const { appliesFrom, replaceId } = saveTarget(await promisify(store.getAll()), now);
  const plan = {
    id: replaceId ?? crypto.randomUUID(),
    appliesFrom,
    income: input.income,
    buckets: input.buckets.map(({ id, name, amount }) => ({ id, name: name.trim(), amount })),
    createdAt: now.toISOString(),
  };
  assertValid('plans', validatePlan(plan));
  await promisify(store.put(plan));
  return plan;
}

export const plansRepo = {
  /**
   * List all versions, oldest start first.
   * @returns {Promise<object[]>}
   */
  async list() {
    return (await base.getAll()).sort((a, b) => a.appliesFrom.localeCompare(b.appliesFrom));
  },

  /**
   * Save the plan. The very first plan starts this month; later changes start next month
   * (and replace the change already waiting for next month).
   * @param {{income: number, buckets: Array<{id: string, name: string, amount: number}>}} input  Paise.
   * @param {Date} [now=new Date()]
   * @returns {Promise<object>} The saved version (see its "appliesFrom").
   */
  save: (input, now = new Date()) => withTransaction(['plans'], 'readwrite', (tx) => writeVersion(tx.objectStore('plans'), input, now)),

  /**
   * End the plan from next month on. Past months keep their numbers.
   * @param {Date} [now=new Date()]
   * @returns {Promise<object>} The saved version.
   */
  stop: (now = new Date()) => plansRepo.save(STOP_INPUT, now),

  /**
   * Cancel the changes that have not started yet. The current plan stays.
   * @param {Date} [now=new Date()]
   * @returns {Promise<number>} How many waiting versions were removed.
   */
  cancelScheduled: (now = new Date()) =>
    withTransaction(['plans'], 'readwrite', async (tx) => {
      const store = tx.objectStore('plans');
      const ids = scheduledIds(await promisify(store.getAll()), now);
      await Promise.all(ids.map((id) => promisify(store.delete(id))));
      return ids.length;
    }),
};
