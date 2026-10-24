/** The list under the pie: color dot, icon, name, amount and percent. Not tappable, so plain list items. */

import { el } from '../../ui/dom.js';
import { formatMoney } from '../../core/money.js';

function legendRow(slice) {
  const dot = el('span', { className: 'legend-dot', attrs: slice.color ? { style: `background:${slice.color}` } : {} });
  return el(
    'li',
    { className: 'legend-row', attrs: { 'data-slice': slice.id } },
    dot,
    el('span', { className: 'legend-icon', text: slice.icon, attrs: { 'aria-hidden': 'true' } }),
    el('span', { className: 'legend-main' }, el('span', { className: 'legend-name', text: slice.name }), slice.note && el('span', { className: 'legend-note', text: slice.note })),
    el('span', { className: 'legend-amount' }, el('span', { text: formatMoney(slice.amount) }), el('span', { className: 'legend-percent', text: slice.percentLabel })),
  );
}

/**
 * Build the legend.
 * @param {Array<{id: string, name: string, icon: string, color: string|null, amount: number, percentLabel: string, note?: string}>} slices
 * @returns {HTMLUListElement}
 */
export function legend(slices) {
  return el('ul', { className: 'legend' }, ...slices.map(legendRow));
}
