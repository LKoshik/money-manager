/** Previous / next month buttons with the month name between them. */

import { el } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';

function stepButton({ label, iconName, key, focusKey, onMonth }) {
  const attrs = { type: 'button', 'aria-label': label, 'data-focus-key': focusKey };
  if (!key) attrs.disabled = ''; // no month to go to: the edge of the data
  return el('button', { className: 'icon-btn', attrs, on: { click: () => key && onMonth(key) } }, icon(iconName, 22));
}

/**
 * Build the month picker.
 * @param {{monthLabel: string, prevKey: string|null, nextKey: string|null}} model
 * @param {(key: string) => void} onMonth  Called with the month key to show.
 * @returns {HTMLElement}
 */
export function monthPicker(model, onMonth) {
  return el(
    'div',
    { className: 'month-picker' },
    stepButton({ label: 'Previous month', iconName: 'back', key: model.prevKey, focusKey: 'prev', onMonth }),
    el('h2', { className: 'month-picker-label', text: model.monthLabel }),
    stepButton({ label: 'Next month', iconName: 'forward', key: model.nextKey, focusKey: 'next', onMonth }),
  );
}
