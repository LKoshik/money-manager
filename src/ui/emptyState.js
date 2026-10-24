/** The friendly block shown when there is nothing to show yet (or something went wrong). */

import { el } from './dom.js';
import { icon } from './icons.js';
import { button } from './button.js';

/**
 * Make an empty-state block.
 * @param {{icon?: string, title: string, message?: string, action?: object}} options
 *   "action" takes the same options as button().
 * @returns {HTMLElement}
 */
export function emptyState({ icon: iconName, title, message, action }) {
  return el(
    'div',
    { className: 'empty-state' },
    iconName && el('div', { className: 'empty-state-icon' }, icon(iconName, 40)),
    el('h2', { text: title }),
    message && el('p', { className: 'muted', text: message }),
    action && button(action),
  );
}
