/**
 * Contributions storage: money set aside for a goal ON PAPER. These never create
 * transactions and never touch accounts. The rules (withdraw <= saved) are checked
 * inside the transaction, so two quick taps cannot break them.
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { syncCompletion } from './goalSync.js';
import { validateContribution } from '../core/validateGoals.js';
import { checkNewContribution, checkRemoval } from '../core/contributionRules.js';
import { normalizeText, assertValid } from '../core/validate.js';

const base = createBaseRepo('contributions', validateContribution);
const STORES = ['goals', 'contributions'];

export const contributionsRepo = {
  /**
   * List all contributions of all goals.
   * @returns {Promise<object[]>}
   */
  list: base.getAll,

  /**
   * Add money to a goal, or withdraw it.
   * @param {{goalId: string, type: 'add'|'withdraw', amount: number, note?: string}} input  Amount in paise, positive.
   * @param {Date} [now=new Date()]
   * @returns {Promise<{contribution: object, reached: boolean}>} reached = the goal JUST reached its target.
   */
  add(input, now = new Date()) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const contributions = tx.objectStore('contributions');
      if (!(await promisify(tx.objectStore('goals').get(input.goalId)))) throw new Error('goals: item not found');
      const existing = await promisify(contributions.index('goalId').getAll(input.goalId));
      assertValid('contribution', checkNewContribution(existing, input));
      const contribution = {
        id: crypto.randomUUID(),
        goalId: input.goalId,
        type: input.type,
        amount: input.amount,
        date: now.toISOString(),
        note: normalizeText(input.note ?? ''),
      };
      assertValid('contribution', validateContribution(contribution));
      await promisify(contributions.put(contribution));
      const { reached } = await syncCompletion(tx, input.goalId, now);
      return { contribution, reached };
    });
  },

  /**
   * Delete one contribution (refused if it would leave a negative saved amount).
   * @param {string} id
   * @param {Date} [now=new Date()]
   * @returns {Promise<{reached: boolean}>} reached = deleting a withdrawal made the goal reach its target.
   */
  remove(id, now = new Date()) {
    return withTransaction(STORES, 'readwrite', async (tx) => {
      const contributions = tx.objectStore('contributions');
      const item = await promisify(contributions.get(id));
      if (!item) throw new Error('contributions: item not found');
      const existing = await promisify(contributions.index('goalId').getAll(item.goalId));
      assertValid('contribution', checkRemoval(existing, id));
      await promisify(contributions.delete(id));
      const { reached } = await syncCompletion(tx, item.goalId, now);
      return { reached };
    });
  },
};
