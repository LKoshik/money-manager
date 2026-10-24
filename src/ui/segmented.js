/** A row of buttons where exactly one is selected (like a switch with 2-4 choices). */

import { el } from './dom.js';

/**
 * Make a segmented control. It updates its own look when tapped.
 * @param {{options: Array<{id: string, label: string}>, value: string, ariaLabel: string,
 *   onChange: (id: string) => void}} config
 * @returns {HTMLElement}
 */
export function segmented({ options, value, ariaLabel, onChange }) {
  const buttons = [];
  for (const option of options) {
    const segment = el('button', {
      className: 'segment',
      text: option.label,
      attrs: { type: 'button', 'aria-pressed': String(option.id === value) },
      on: {
        click: () => {
          buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === segment)));
          onChange(option.id);
        },
      },
    });
    buttons.push(segment);
  }
  return el('div', { className: 'segmented', attrs: { role: 'group', 'aria-label': ariaLabel } }, ...buttons);
}
