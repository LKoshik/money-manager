/**
 * Budgets storage. There is at most ONE budget per category
 * (the database enforces this with a unique index).
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { validateBudget, assertValid } from '../core/validate.js';

const base = createBaseRepo('budgets', validateBudget);

export const budgetsRepo = {
  /**
   * Get all budgets.
   * @returns {Promise<object[]>}
   */
  list: base.getAll,

  /**
   * Set the monthly limit of a category: creates the budget, or changes it if it exists.
   * @param {string} categoryId
   * @param {number} monthlyLimit  Positive paise.
   * @returns {Promise<object>} The saved budget.
   */
  async setLimit(categoryId, monthlyLimit) {
    return withTransaction(['budgets'], 'readwrite', async (tx) => {
      const store = tx.objectStore('budgets');
      const existing = await promisify(store.index('categoryId').get(categoryId));
      const budget = { id: existing?.id ?? crypto.randomUUID(), categoryId, monthlyLimit };
      assertValid('budgets', validateBudget(budget));
      await promisify(store.put(budget));
      return budget;
    });
  },

  /** Delete a budget. */
  remove: base.remove,
};
