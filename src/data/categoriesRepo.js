/**
 * Categories storage. Like accounts: a category that has transactions
 * is archived, never deleted.
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { validateCategory, normalizeText } from '../core/validate.js';

const base = createBaseRepo('categories', validateCategory);
const byName = (a, b) => a.name.localeCompare(b.name);

export const categoriesRepo = {
  /**
   * List categories, A to Z.
   * @param {{kind?: 'income'|'expense', includeArchived?: boolean}} [options]
   * @returns {Promise<object[]>}
   */
  async list({ kind, includeArchived = false } = {}) {
    const all = await base.getAll();
    return all
      .filter((category) => includeArchived || !category.archived)
      .filter((category) => !kind || category.kind === kind)
      .sort(byName);
  },

  getById: base.getById,

  /**
   * Create a category.
   * @param {{name: string, icon: string, color: string, kind: 'income'|'expense'}} input
   * @returns {Promise<object>} The saved category.
   */
  async create({ name, icon, color, kind }) {
    return base.put({
      id: crypto.randomUUID(),
      name: normalizeText(name),
      icon,
      color,
      kind,
      archived: false,
    });
  },

  /**
   * Change fields of a category.
   * @param {string} id
   * @param {object} changes
   * @returns {Promise<object>}
   */
  async update(id, changes) {
    const cleaned = 'name' in changes ? { ...changes, name: normalizeText(changes.name) } : changes;
    return base.update(id, cleaned);
  },

  /** Hide a category from lists, keeping its history. */
  archive: (id) => base.update(id, { archived: true }),

  /** Bring an archived category back. */
  unarchive: (id) => base.update(id, { archived: false }),

  /**
   * "Delete" a category the safe way. With no transactions it is really
   * deleted (and its budget with it). Otherwise it is archived.
   * @param {string} id
   * @returns {Promise<'deleted'|'archived'>}
   */
  removeOrArchive(id) {
    return withTransaction(['categories', 'transactions', 'budgets'], 'readwrite', async (tx) => {
      const categories = tx.objectStore('categories');
      const category = await promisify(categories.get(id));
      if (!category) throw new Error(`categories: item not found (${id})`);

      const used = await promisify(tx.objectStore('transactions').index('categoryId').count(id));
      if (used > 0) {
        await promisify(categories.put({ ...category, archived: true }));
        return 'archived';
      }
      const budgets = tx.objectStore('budgets');
      const budgetIds = await promisify(budgets.index('categoryId').getAllKeys(id));
      await Promise.all(budgetIds.map((budgetId) => promisify(budgets.delete(budgetId))));
      await promisify(categories.delete(id));
      return 'deleted';
    });
  },
};
