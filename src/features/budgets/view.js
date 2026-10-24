/** The Budgets screen: month, total, budgets with progress, categories without a limit. */

import { el } from '../../ui/dom.js';
import { emptyState } from '../../ui/emptyState.js';
import { listRow } from '../../ui/listRow.js';
import { openCategorySheet } from '../../ui/categorySheet.js';
import { buildBudgetsModel } from './logic.js';
import { budgetBar } from './budgetBar.js';
import { budgetRow } from './budgetRow.js';
import { openLimitSheet } from './limitSheet.js';
import { formatRemaining, formatSpentOfLimit } from '../../core/budgetList.js';
import { formatMoney } from '../../core/money.js';

function summaryCard(summary) {
  return el(
    'section',
    { className: 'card stack budget-summary' },
    el('div', { className: 'budget-row-top' }, el('h2', { className: 'budget-title', text: 'All budgets' }), el('span', { className: `budget-row-remaining budget-text--${summary.level}`, text: formatRemaining(summary) })),
    budgetBar(summary, 'All budgets'),
    el('span', { className: 'muted', text: `${formatSpentOfLimit(summary)} · ${summary.percent}%` }),
  );
}

function unbudgetedRow({ category, spent }) {
  return listRow({
    icon: category.icon,
    color: category.color,
    title: category.name,
    subtitle: spent > 0 ? `Spent ${formatMoney(spent)} this month` : 'No limit set',
    amount: 'Set limit',
    amountClass: 'budget-set-link',
    ariaLabel: `${category.name}, no limit. Set limit`,
    onClick: () => openLimitSheet({ category, spent }),
  });
}

function section(title, ...rows) {
  return el('section', { className: 'stack' }, el('h2', { className: 'budget-title', text: title }), el('div', { className: 'list-card' }, ...rows));
}

function buildBody(model) {
  const { rows, unbudgeted, summary } = model;
  const noBudgets = emptyState({ icon: 'target', title: 'No budgets yet', message: 'Tap a category below to set its monthly limit.' });
  return [
    summary && summaryCard(summary),
    rows.length === 0 ? noBudgets : section('Budgets', ...rows.map((row) => budgetRow(row, () => openLimitSheet({ category: row.category, budget: row.budget, spent: row.status.spent })))),
    unbudgeted.length > 0 && section('No limit yet', ...unbudgeted.map(unbudgetedRow)),
  ];
}

/**
 * Build the Budgets screen.
 * @param {{categories: object[], budgets: object[], transactions: object[]}} state
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function buildView(state, now = new Date()) {
  const model = buildBudgetsModel(state, now);
  const month = el('p', { className: 'muted', text: model.monthLabel });
  if (model.rows.length === 0 && model.unbudgeted.length === 0) {
    const empty = emptyState({
      icon: 'target',
      title: 'No expense categories',
      message: 'A budget is a monthly limit for an expense category. Create one first.',
      action: { label: 'New category', icon: 'plus', onClick: () => openCategorySheet({ kind: 'expense', onCreated: () => {} }) },
    });
    return el('div', { className: 'stack' }, month, empty);
  }
  return el('div', { className: 'stack' }, month, ...buildBody(model));
}
