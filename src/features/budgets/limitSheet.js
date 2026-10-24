/** The bottom sheet to set, change or remove the monthly limit of one category. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { amountField } from '../../ui/amountField.js';
import { errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { setBudgetLimit, removeBudget } from '../../state/actions.js';
import { paiseToText } from '../../core/amountInput.js';
import { limitTextToPaise } from '../../core/budgetLimit.js';
import { formatMoney } from '../../core/money.js';

async function save(session, saveButton) {
  const { paise, problem } = limitTextToPaise(session.text);
  if (problem) return session.errors.show([problem]);
  saveButton.disabled = true;
  try {
    await setBudgetLimit(session.category.id, paise);
    await session.sheet.close();
    showToast('Budget saved');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    session.errors.show(['Could not save. Please try again.']);
  }
}

async function remove(session) {
  const sure = await confirmDialog({
    title: 'Remove this budget?',
    message: `The monthly limit for ${session.category.name} is removed. Your transactions stay as they are.`,
    confirmLabel: 'Remove',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeBudget(session.budget.id);
    await session.sheet.close();
    showToast('Budget removed');
  } catch (error) {
    console.error(error);
    showToast('Something went wrong. Please try again.', { kind: 'error' });
  }
}

function buildContent(session) {
  const { category, budget, spent } = session;
  const head = el(
    'div',
    { className: 'limit-head', attrs: { style: `--row-color:${category.color}` } },
    el('span', { className: 'list-row-icon', text: category.icon }),
    el('span', { className: 'limit-head-text' }, el('strong', { text: category.name }), el('span', { className: 'muted', text: `Spent this month: ${formatMoney(spent)}` })),
  );
  const pad = amountField({
    text: session.text,
    type: 'budget',
    onChange(text) {
      session.text = text;
      session.errors.clear();
    },
  });
  const saveButton = button({ label: 'Save limit', block: true, onClick: () => save(session, saveButton) });
  const removeButton = budget && button({ label: 'Remove limit', variant: 'danger', block: true, onClick: () => remove(session) });
  return el('div', { className: 'stack' }, head, el('p', { className: 'muted limit-hint', text: 'Monthly limit' }), pad, session.errors.element, saveButton, removeButton);
}

/**
 * Open the limit sheet.
 * @param {{category: object, budget?: object|null, spent: number}} options
 *   Give the budget to change or remove it; give none to set a new limit.
 *   spent is this month's spending in paise (shown so the person can pick a sensible limit).
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openLimitSheet({ category, budget = null, spent }) {
  const session = { category, budget, spent, text: budget ? paiseToText(budget.monthlyLimit) : '', errors: errorBox(), sheet: null };
  session.sheet = openBottomSheet({ title: budget ? 'Change limit' : 'Set limit', content: buildContent(session) });
  return session.sheet;
}
