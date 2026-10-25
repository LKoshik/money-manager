/** Runs the recurring rules and tells the person when transactions were added. */

import { showToast } from './toast.js';
import { store } from '../state/store.js';
import { runRecurring } from '../state/actions.js';

/**
 * Create what is due now (nothing happens while the feature is OFF) and show a toast.
 * Never throws: a problem here must not break the app.
 * @returns {Promise<void>}
 */
export async function runAndAnnounce() {
  try {
    const added = await runRecurring();
    if (added > 0) showToast(`Added ${added} recurring transaction${added === 1 ? '' : 's'}`);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Run again when accounts or categories change, so a rule that was blocked by an
 * archived account catches up as soon as the person fixes it.
 * @returns {() => void} Stops listening.
 */
export function runWhenListsChange() {
  let seen = store.getState();
  return store.subscribe((state) => {
    if (state.accounts === seen.accounts && state.categories === seen.categories) return;
    seen = state;
    runAndAnnounce();
  });
}
