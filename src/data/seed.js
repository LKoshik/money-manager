/**
 * First-launch setup: adds the default categories once.
 * Accounts are NOT created here. The person adds their own,
 * and the app shows a friendly empty state until then.
 */

import { withTransaction, promisify, putAll } from './baseRepo.js';
import { validateCategory, assertValid } from '../core/validate.js';

// [name, icon, color]
const EXPENSE_DEFAULTS = [
  ['Food', '🍔', '#ef4444'],
  ['Groceries', '🛒', '#f97316'],
  ['Transport', '🚌', '#eab308'],
  ['Fuel', '⛽', '#84cc16'],
  ['Shopping', '🛍️', '#ec4899'],
  ['Bills', '💡', '#06b6d4'],
  ['Rent', '🏠', '#8b5cf6'],
  ['Health', '💊', '#14b8a6'],
  ['Entertainment', '🎬', '#a855f7'],
  ['Education', '📚', '#3b82f6'],
  ['Travel', '✈️', '#0ea5e9'],
  ['Other', '📦', '#64748b'],
];

const INCOME_DEFAULTS = [
  ['Salary', '💼', '#16a34a'],
  ['Business', '🏪', '#22c55e'],
  ['Gifts', '🎁', '#10b981'],
  ['Interest', '🏦', '#059669'],
  ['Other income', '💰', '#65a30d'],
];

/**
 * Build the default categories (new ids every time).
 * @returns {object[]}
 */
export function buildDefaultCategories() {
  const make = (kind) => ([name, icon, color]) => ({
    id: crypto.randomUUID(),
    name,
    icon,
    color,
    kind,
    archived: false,
  });
  return [...EXPENSE_DEFAULTS.map(make('expense')), ...INCOME_DEFAULTS.map(make('income'))];
}

/**
 * Add the default categories if this is the first launch.
 * It is safe to call on every start: after the first time it does nothing.
 * @returns {Promise<boolean>} true if it added them just now.
 */
export function seedIfFirstLaunch() {
  return withTransaction(['categories', 'settings'], 'readwrite', async (tx) => {
    const settings = tx.objectStore('settings');
    const flag = await promisify(settings.get('seeded'));
    if (flag?.value === true) return false;

    const categories = tx.objectStore('categories');
    // If categories are already here (for example from an import), do not add more.
    if ((await promisify(categories.count())) === 0) {
      const defaults = buildDefaultCategories();
      defaults.forEach((category) => assertValid('category', validateCategory(category)));
      await putAll(categories, defaults);
    }
    await promisify(settings.put({ key: 'seeded', value: true }));
    return true;
  });
}
