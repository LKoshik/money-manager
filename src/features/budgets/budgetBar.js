/** The progress bar of a budget. Color comes from the level (ok / warning / over). */

import { el } from '../../ui/dom.js';

/**
 * Make a progress bar.
 * @param {{barPercent: number, percent: number, level: 'ok'|'warning'|'over'}} status
 * @param {string} label  Read out by screen readers. Example: "Food"
 * @returns {HTMLElement}
 */
export function budgetBar(status, label) {
  const fill = el('div', { className: `budget-bar-fill budget-bar-fill--${status.level}`, attrs: { style: `width:${status.barPercent}%` } });
  return el(
    'div',
    {
      className: 'budget-bar',
      attrs: {
        role: 'progressbar',
        'aria-label': `${label}: ${status.percent}% of the limit used`,
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(status.barPercent),
      },
    },
    fill,
  );
}
