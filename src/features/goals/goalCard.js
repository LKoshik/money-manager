/** One goal in the list: icon, name, progress bar, amounts, pace line. Tap opens the goal sheet. */

import { el } from '../../ui/dom.js';
import { goalBar } from './goalBar.js';
import { progressText, paceText } from '../../core/goalText.js';

/**
 * @param {object} row  One row from core/goalList buildGoalRows.
 * @param {Date} now
 * @param {() => void} onOpen
 * @returns {HTMLButtonElement}
 */
export function goalCard(row, now, onOpen) {
  const { goal } = row;
  return el(
    'button',
    {
      className: `goal-card${goal.archived ? ' goal-card--archived' : ''}`,
      attrs: { type: 'button', style: `--goal-color:${goal.color}`, 'aria-label': `${goal.name}. ${progressText(row)}. ${paceText(row, now)}` },
      on: { click: onOpen },
    },
    el('span', { className: 'goal-card-top' }, el('span', { className: 'goal-icon', text: goal.icon }), el('span', { className: 'goal-card-name', text: goal.name })),
    goalBar(row, goal.name),
    el('span', { className: 'goal-progress', text: progressText(row) }),
    el('span', { className: `goal-pace goal-pace--${row.status}`, text: paceText(row, now) }),
  );
}
