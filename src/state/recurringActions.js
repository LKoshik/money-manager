/** Actions for recurring rules. Re-exported by state/actions.js. */

import { store } from './store.js';
import { refresh, action } from './loaders.js';
import { recurringRepo } from '../data/recurringRepo.js';
import { settingsRepo } from '../data/settingsRepo.js';

/**
 * Create the transactions that are due (only when the feature is ON).
 * The screens that call this decide about the toast, because state/ cannot show one.
 * @param {Date} [now=new Date()]
 * @returns {Promise<number>} How many transactions were created.
 */
export async function runRecurring(now = new Date()) {
  if (!store.getState().settings.recurringEnabled) return 0;
  const added = await recurringRepo.generateAll(now);
  if (added > 0) await refresh(['recurring', 'transactions']);
  return added;
}

/**
 * Add a rule. A start date in the past creates the missed transactions at once.
 * @param {object} input See recurringRepo.create.
 * @returns {Promise<{rule: object, added: number}>}
 */
export async function addRecurring(input) {
  const rule = await recurringRepo.create(input);
  await refresh(['recurring']);
  return { rule, added: await runRecurring() };
}

/**
 * Change a rule (also pause/resume with {active}). Fixing a blocked rule lets it catch up.
 * @param {string} id
 * @param {object} changes
 * @returns {Promise<{rule: object, added: number}>}
 */
export async function updateRecurring(id, changes) {
  const rule = await recurringRepo.update(id, changes);
  await refresh(['recurring']);
  return { rule, added: await runRecurring() };
}

/** Delete a rule. Transactions it already made stay. @param {string} id */
export const removeRecurring = action(['recurring'], (id) => recurringRepo.remove(id));

/**
 * Switch the recurring feature on or off. Switching ON first moves every rule to its
 * next occurrence, so nothing from the time it was OFF is added.
 * @param {boolean} enabled
 * @returns {Promise<void>}
 */
export async function setRecurringEnabled(enabled) {
  if (enabled) await recurringRepo.skipAll(new Date());
  await settingsRepo.set('recurringEnabled', enabled);
  await refresh(['settings', 'recurring']);
}
