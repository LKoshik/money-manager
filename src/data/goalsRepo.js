/** Goals storage. Deleting a goal deletes its contributions in the SAME transaction. */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { syncCompletion } from './goalSync.js';
import { validateGoal } from '../core/validateGoals.js';
import { normalizeText, assertValid } from '../core/validate.js';

const base = createBaseRepo('goals', validateGoal);
const byCreatedAt = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

/** Keep only the fields a person can change. */
function cleanFields(input) {
  return {
    name: normalizeText(input.name),
    icon: input.icon,
    color: input.color,
    targetAmount: input.targetAmount,
    deadline: input.deadline ?? null,
    archived: input.archived ?? false,
  };
}

export const goalsRepo = {
  /**
   * List all goals (archived too), oldest first.
   * @returns {Promise<object[]>}
   */
  async list() {
    return (await base.getAll()).sort(byCreatedAt);
  },

  getById: base.getById,

  /**
   * Create a goal. It starts with nothing saved.
   * @param {{name: string, icon: string, color: string, targetAmount: number, deadline?: string|null}} input  Amount in paise.
   * @returns {Promise<object>} The saved goal.
   */
  create(input) {
    const goal = { id: crypto.randomUUID(), ...cleanFields({ ...input, archived: false }), createdAt: new Date().toISOString(), completedAt: null };
    return base.put(goal);
  },

  /**
   * Change a goal (also archive/restore with {archived}). A new target can reach or un-reach the goal.
   * @param {string} id
   * @param {object} changes  Any field you can give to create(), or "archived".
   * @param {Date} [now=new Date()]
   * @returns {Promise<{goal: object, reached: boolean}>} reached = the goal JUST became reached.
   */
  update(id, changes, now = new Date()) {
    return withTransaction(['goals', 'contributions'], 'readwrite', async (tx) => {
      const store = tx.objectStore('goals');
      const current = await promisify(store.get(id));
      if (!current) throw new Error(`goals: item not found (${id})`);
      const merged = { ...current, ...cleanFields({ ...current, ...changes }) };
      assertValid('goals', validateGoal(merged));
      await promisify(store.put(merged));
      return syncCompletion(tx, id, now);
    });
  },

  /**
   * Delete a goal AND all its contributions.
   * @param {string} id
   * @returns {Promise<void>}
   */
  remove(id) {
    return withTransaction(['goals', 'contributions'], 'readwrite', async (tx) => {
      const contributions = tx.objectStore('contributions');
      const keys = await promisify(contributions.index('goalId').getAllKeys(id));
      await promisify(tx.objectStore('goals').delete(id));
      await Promise.all(keys.map((key) => promisify(contributions.delete(key))));
    });
  },
};
