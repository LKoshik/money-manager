/**
 * Keeps goal.completedAt true. Call it INSIDE a repo transaction (stores: goals + contributions)
 * after anything that changes the saved amount or the target. Only awaits DB requests.
 */

import { promisify } from './baseRepo.js';
import { saved, completionFor } from '../core/goalModel.js';
import { validateGoal } from '../core/validateGoals.js';
import { assertValid } from '../core/validate.js';

/**
 * Set completedAt when the goal is reached, clear it when it is not.
 * @param {IDBTransaction} tx
 * @param {string} goalId
 * @param {Date} now
 * @returns {Promise<{goal: object, reached: boolean}>} reached = true only when the goal JUST became reached.
 */
export async function syncCompletion(tx, goalId, now) {
  const goals = tx.objectStore('goals');
  const goal = await promisify(goals.get(goalId));
  if (!goal) throw new Error(`goals: item not found (${goalId})`);
  const list = await promisify(tx.objectStore('contributions').index('goalId').getAll(goalId));
  const completedAt = completionFor(goal, saved(list), now);
  if (completedAt === goal.completedAt) return { goal, reached: false };
  const next = { ...goal, completedAt };
  assertValid('goals', validateGoal(next));
  await promisify(goals.put(next));
  return { goal: next, reached: completedAt !== null };
}
