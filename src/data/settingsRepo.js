/**
 * Settings: small key/value pairs (theme, last backup date, ...).
 * Only keys listed in SETTING_DEFAULTS are allowed, so a typo cannot
 * silently create a new setting.
 */

import { withTransaction, promisify } from './baseRepo.js';
import { SETTING_DEFAULTS, validateSetting, assertValid } from '../core/validate.js';

const STORE = 'settings';

export const settingsRepo = {
  /**
   * Read one setting. Gives the default if the user never changed it.
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    assertValid('setting', validateSetting(key, SETTING_DEFAULTS[key]));
    const row = await withTransaction([STORE], 'readonly', (tx) =>
      promisify(tx.objectStore(STORE).get(key)),
    );
    return row ? row.value : SETTING_DEFAULTS[key];
  },

  /**
   * Save one setting.
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    assertValid('setting', validateSetting(key, value));
    await withTransaction([STORE], 'readwrite', (tx) =>
      promisify(tx.objectStore(STORE).put({ key, value })),
    );
  },

  /**
   * Read all settings at once (defaults fill the gaps).
   * @returns {Promise<Object<string, any>>}
   */
  async getAll() {
    const rows = await withTransaction([STORE], 'readonly', (tx) =>
      promisify(tx.objectStore(STORE).getAll()),
    );
    return { ...SETTING_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  },
};
