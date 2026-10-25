/** One row of a list (a transaction or an account): round icon, two lines of text, an amount. */

import { el } from './dom.js';
import { icon as drawIcon } from './icons.js';

/**
 * Make a row. Put rows inside an element with the class "list-card".
 * @param {{icon: string, color?: string, title: string, subtitle?: string, amount: string,
 *   amountClass?: string, onClick?: () => void, ariaLabel?: string, badge?: string}} config
 *   icon is an emoji. badge is an icon name drawn small after the title. amountClass is "amount--income", "amount--expense" or empty.
 * @returns {HTMLButtonElement}
 */
export function listRow({ icon, color, title, subtitle, amount, amountClass = '', onClick, ariaLabel, badge }) {
  const attrs = { type: 'button' };
  if (color) attrs.style = `--row-color:${color}`;
  if (ariaLabel) attrs['aria-label'] = ariaLabel;
  return el(
    'button',
    { className: 'list-row', attrs, on: onClick ? { click: onClick } : {} },
    el('span', { className: 'list-row-icon', text: icon }),
    el(
      'span',
      { className: 'list-row-main' },
      el('span', { className: 'list-row-title', text: title }, badge && el('span', { className: 'list-row-badge', attrs: { title: 'Recurring' } }, drawIcon(badge, 14))),
      subtitle && el('span', { className: 'list-row-sub', text: subtitle }),
    ),
    el('span', { className: `list-row-amount ${amountClass}`.trim(), text: amount }),
  );
}
