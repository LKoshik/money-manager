/** One budget in the list: icon, name, what is left, progress bar, spent / limit. */

import { el } from '../../ui/dom.js';
import { budgetBar } from './budgetBar.js';
import { formatRemaining, formatSpentOfLimit } from '../../core/budgetList.js';

/**
 * Make a budget row. Put rows inside an element with the class "list-card".
 * @param {{category: object, archived: boolean, status: object}} row
 * @param {() => void} onClick  Opens the limit sheet.
 * @returns {HTMLButtonElement}
 */
export function budgetRow({ category, archived, status }, onClick) {
  const name = archived ? `${category.name} (archived)` : category.name;
  const remaining = formatRemaining(status);
  return el(
    'button',
    { className: 'budget-row', attrs: { type: 'button', style: `--row-color:${category.color}`, 'aria-label': `${name}, ${remaining}. Change limit` }, on: { click: onClick } },
    el(
      'span',
      { className: 'budget-row-top' },
      el('span', { className: 'list-row-icon', text: category.icon }),
      el('span', { className: 'budget-row-name', text: name }),
      el('span', { className: `budget-row-remaining budget-text--${status.level}`, text: remaining }),
    ),
    budgetBar(status, name),
    el('span', { className: 'budget-row-bottom' }, el('span', { text: formatSpentOfLimit(status) }), el('span', { text: `${status.percent}%` })),
  );
}
