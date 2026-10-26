/** The card at the top of the Goals screen: the planner money available to assign, and the button to assign it. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { formatMoney } from '../../core/money.js';

const line = (label, value) =>
  el('div', { className: 'plan-line' }, el('span', { className: 'plan-line-label', text: label }), el('span', { className: 'plan-line-value', text: value }));

/**
 * @param {{available: number, carriedOver: number, thisMonthLeft: number, overBy: number}} stack  From availableToAssign.
 * @param {boolean} hasOpenGoal  Is there a goal that can receive money?
 * @param {() => void} onAssign
 * @returns {HTMLElement}
 */
export function availableCard(stack, hasOpenGoal, onAssign) {
  const over = stack.overBy > 0;
  return el(
    'section',
    { className: 'card stack assign-card' },
    el('h2', { className: 'goal-summary-title', text: 'Available to assign' }),
    el('div', { className: `assign-amount${over ? ' assign-amount--over' : ''}`, text: formatMoney(stack.available) }),
    line('Carried over', formatMoney(stack.carriedOver)),
    line('This month', formatMoney(stack.thisMonthLeft)),
    over && el('p', { className: 'plan-warning', attrs: { role: 'alert' }, text: `You have assigned ${formatMoney(stack.overBy)} more than your allowance.` }),
    !hasOpenGoal && el('p', { className: 'muted goal-hint', text: 'Create a goal to assign money to it.' }),
    button({ label: 'Assign to a goal', icon: 'flag', block: true, disabled: !hasOpenGoal || stack.available <= 0, onClick: onAssign }),
  );
}
