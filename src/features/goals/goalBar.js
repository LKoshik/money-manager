/** The progress bar of a goal (accent color; income color when reached). */

import { el } from '../../ui/dom.js';

/**
 * @param {{barPercent: number, percent: number, status: string}} progress  A goal row or the totals.
 * @param {string} label  Read out by screen readers. Example: "New phone"
 * @returns {HTMLElement}
 */
export function goalBar(progress, label) {
  const fill = el('div', { className: `goal-bar-fill goal-bar-fill--${progress.status}`, attrs: { style: `width:${progress.barPercent}%` } });
  return el(
    'div',
    {
      className: 'goal-bar',
      attrs: {
        role: 'progressbar',
        'aria-label': `${label}: ${progress.percent}% saved`,
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(progress.barPercent),
      },
    },
    fill,
  );
}
