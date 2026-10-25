/**
 * Accounts storage. An account that has transactions is never really
 * deleted, because that would break the history. It is archived instead.
 */

import { createBaseRepo, withTransaction, promisify } from './baseRepo.js';
import { validateAccount, normalizeText } from '../core/validate.js';
import { ACCOUNT_REFERENCES, referenceStores, isReferenced } from './references.js';

const base = createBaseRepo('accounts', validateAccount);
const byCreatedAt = (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

export const accountsRepo = {
  /**
   * List accounts, oldest first.
   * @param {{includeArchived?: boolean}} [options]
   * @returns {Promise<object[]>}
   */
  async list({ includeArchived = false } = {}) {
    const all = await base.getAll();
    return all.filter((account) => includeArchived || !account.archived).sort(byCreatedAt);
  },

  getById: base.getById,

  /**
   * Create an account.
   * @param {{name: string, type: string, openingBalance?: number, currency?: string}} input
   *   openingBalance is in paise.
   * @returns {Promise<object>} The saved account.
   */
  async create({ name, type, openingBalance = 0, currency = 'INR' }) {
    return base.put({
      id: crypto.randomUUID(),
      name: normalizeText(name),
      type,
      openingBalance,
      currency,
      archived: false,
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * Change fields of an account (example: its name).
   * @param {string} id
   * @param {object} changes
   * @returns {Promise<object>}
   */
  async update(id, changes) {
    // Only clean the name if the caller is changing it.
    const cleaned = 'name' in changes ? { ...changes, name: normalizeText(changes.name) } : changes;
    return base.update(id, cleaned);
  },

  /** Hide an account from lists, keeping its history. */
  archive: (id) => base.update(id, { archived: true }),

  /** Bring an archived account back. */
  unarchive: (id) => base.update(id, { archived: false }),

  /**
   * "Delete" an account the safe way: really delete it if it is not used
   * (by transactions or recurring rules), otherwise archive it.
   * @param {string} id
   * @returns {Promise<'deleted'|'archived'>}
   */
  removeOrArchive(id) {
    return withTransaction(['accounts', ...referenceStores(ACCOUNT_REFERENCES)], 'readwrite', async (tx) => {
      const accounts = tx.objectStore('accounts');
      const account = await promisify(accounts.get(id));
      if (!account) throw new Error(`accounts: item not found (${id})`);

      if (!(await isReferenced(tx, ACCOUNT_REFERENCES, id))) {
        await promisify(accounts.delete(id));
        return 'deleted';
      }
      await promisify(accounts.put({ ...account, archived: true }));
      return 'archived';
    });
  },
};
