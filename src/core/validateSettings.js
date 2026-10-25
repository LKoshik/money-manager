/** The settings we know about, and the check for each value. */

import { isText, isDateText, collect } from './validateParts.js';

/** Settings we know about, and the value each has before the user changes it. */
export const SETTING_DEFAULTS = Object.freeze({
  theme: null, // null = not chosen yet (follow the phone)
  lastBackupAt: null,
  seeded: false, // true after the default categories were added
  lastAccountId: null, // the account of the last new transaction (the Add flow starts with it)
  recurringEnabled: false, // OFF until the user turns recurring transactions on
});

/**
 * @param {string} key  One of the keys in SETTING_DEFAULTS.
 * @param {unknown} value
 * @returns {string[]} Problems found (empty if valid).
 */
export function validateSetting(key, value) {
  if (!Object.hasOwn(SETTING_DEFAULTS, key)) return [`unknown setting: ${key}`];
  const rules = {
    theme: [value === null || value === 'light' || value === 'dark', 'theme must be null, "light" or "dark"'],
    lastBackupAt: [value === null || isDateText(value), 'lastBackupAt must be null or an ISO date'],
    seeded: [typeof value === 'boolean', 'seeded must be true or false'],
    lastAccountId: [value === null || isText(value), 'lastAccountId must be null or an account id'],
    recurringEnabled: [typeof value === 'boolean', 'recurringEnabled must be true or false'],
  };
  return collect([rules[key]]);
}
