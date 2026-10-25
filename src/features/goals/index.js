import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'goals';
export const title = 'Goals';
export const icon = 'flag';
export const route = '/goals';
export const order = 80;
export const nav = false;
export const menu = 30;

/**
 * Draw the Goals screen, and draw it again when the data changes.
 * "Show archived" is kept here (not in the store), so it survives those redraws.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  let showArchived = false;
  const draw = () =>
    container.replaceChildren(
      buildView(store.getState(), {
        showArchived,
        onToggleArchived() {
          showArchived = !showArchived;
          draw();
        },
      }),
    );
  draw();
  return store.subscribe(draw);
}
