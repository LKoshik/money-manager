import { buildScreen } from './view.js';
import { openAddFlow } from './addFlow.js';

export const id = 'transactions';
export const title = 'Transactions';
export const tabLabel = 'History'; // "Transactions" is too long for a tab
export const icon = 'list';
export const route = '/transactions';
export const order = 20;

/** The big "+" button in the bottom bar opens the Add flow. */
export const quickAction = { title: 'Add transaction', icon: 'plus', open: openAddFlow };

/**
 * Draw the transactions screen.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  const screen = buildScreen();
  container.append(screen.element);
  return screen.destroy;
}
