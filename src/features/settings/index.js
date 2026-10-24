import { createScreen } from './screen.js';

export const id = 'settings';
export const title = 'Settings';
export const icon = 'sliders';
export const route = '/settings';
export const order = 60;
export const nav = false;

/**
 * Draw the Settings screen, and draw it again when data or settings change.
 * @param {HTMLElement} container
 * @returns {() => void} Cleanup.
 */
export function render(container) {
  return createScreen(container);
}
