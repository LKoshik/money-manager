/** One plan as a card: income, the buckets, and the calculated wishes allowance (with a warning when the buckets are too big). */

import { el } from '../../ui/dom.js';
import { formatMoney } from '../../core/money.js';

const line = (label, value, className = '') =>
  el('div', { className: `plan-line ${className}`.trim() }, el('span', { className: 'plan-line-label', text: label }), el('span', { className: 'plan-line-value', text: value }));

/**
 * @param {{title: string, subtitle?: string, plan: {buckets: Array<{id: string, name: string, amount: number}>}, summary: {income: number, allowance: number, overBy: number}}} config
 * @returns {HTMLElement}
 */
export function planCard({ title, subtitle, plan, summary }) {
  const over = summary.overBy > 0;
  return el(
    'section',
    { className: 'card stack plan-card' },
    el('div', { className: 'plan-card-top' }, el('h2', { className: 'plan-card-title', text: title }), subtitle && el('span', { className: 'muted', text: subtitle })),
    line('Monthly income', formatMoney(summary.income), 'plan-line--income'),
    ...plan.buckets.map((bucket) => line(bucket.name, formatMoney(bucket.amount))),
    line('Wishes allowance', formatMoney(summary.allowance), over ? 'plan-line--total plan-line--over' : 'plan-line--total'),
    over && el('p', { className: 'plan-warning', attrs: { role: 'alert' }, text: `Your buckets are ${formatMoney(summary.overBy)} more than your income. Nothing is left for wishes.` }),
  );
}
