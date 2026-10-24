import { createScreen } from './screen.js';

export const id = 'reports';
export const title = 'Reports';
export const icon = 'chart';
export const route = '/reports';
export const order = 40;
export const nav = true;

/**
 * Draw the Reports screen, and draw it again when the data changes.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  return createScreen(container);
}
