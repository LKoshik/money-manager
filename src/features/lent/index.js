import { store } from '../../state/store.js';
import { buildView } from './view.js';

export const id = 'lent';
export const title = 'Lent & borrowed';
export const icon = 'swap';
export const route = '/lent';
export const order = 90;
export const nav = false;

/**
 * Draw the Lent & borrowed screen, and draw it again when the data changes.
 * The chosen tab and "Show settled" are kept here (not in the store), so they survive those redraws.
 * @param {HTMLElement} container
 * @returns {() => void} Stops listening to the store.
 */
export function render(container) {
  const view = { direction: 'lent', showSettled: false };
  const draw = () =>
    container.replaceChildren(
      buildView(store.getState(), {
        ...view,
        onDirection(direction) {
          view.direction = direction;
          view.showSettled = false;
          draw();
        },
        onToggleSettled() {
          view.showSettled = !view.showSettled;
          draw();
        },
      }),
    );
  draw();
  return store.subscribe(draw);
}
