/** An on/off switch. The tap area is at least 44px tall. */

import { el } from './dom.js';

/**
 * Make a switch. It flips itself when tapped, and flips back if onChange fails.
 * @param {{checked: boolean, ariaLabel: string, onChange: (checked: boolean) => (void|Promise<void>)}} config
 * @returns {HTMLButtonElement}
 */
export function toggleSwitch({ checked, ariaLabel, onChange }) {
  const set = (value) => node.setAttribute('aria-checked', String(value));
  const node = el(
    'button',
    {
      className: 'switch',
      attrs: { type: 'button', role: 'switch', 'aria-checked': String(checked), 'aria-label': ariaLabel },
      on: {
        async click() {
          const next = node.getAttribute('aria-checked') !== 'true';
          set(next);
          try {
            await onChange(next);
          } catch (error) {
            console.error(error);
            set(!next); // the change failed: show the truth
          }
        },
      },
    },
    el('span', { className: 'switch-track' }, el('span', { className: 'switch-knob' })),
  );
  return node;
}
