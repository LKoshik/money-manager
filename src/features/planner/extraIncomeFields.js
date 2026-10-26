/** The two ways to tell the planner where extra money came from: record it new, or link an income already recorded. */

import { el } from '../../ui/dom.js';
import { listRow } from '../../ui/listRow.js';
import { choiceGrid } from '../../ui/choiceGrid.js';
import { accountGrid } from '../../ui/accountGrid.js';
import { textField } from '../../ui/formField.js';
import { amountInput } from './amountBox.js';
import { selectableAccounts, selectableCategories } from '../../core/transactionDraft.js';
import { linkableTransactions } from '../../core/extraIncome.js';
import { formatMoney } from '../../core/money.js';
import { formatDayLabel } from '../../core/dateLabels.js';
import { toDayKey } from '../../core/dates.js';

const section = (title, child) => el('div', { className: 'stack' }, el('h3', { className: 'form-section-title', text: title }), child);
const MAX_LINKABLE = 20;

/**
 * A new income: amount, date, account and category (the income transaction is created with it).
 * @param {{draft: object, accounts: object[], categories: object[], onChange: () => void}} config
 * @returns {HTMLElement}
 */
export function newIncomeFields({ draft, accounts, categories, onChange }) {
  const amount = el('label', { className: 'field' }, el('span', { className: 'field-label', text: 'Amount' }), amountInput(draft.amountText, 'Amount', (text) => { draft.amountText = text; onChange(); }));
  const date = textField({ label: 'Date and time', value: draft.dateLocal, attrs: { type: 'datetime-local' }, onInput: (value) => { draft.dateLocal = value; } });
  const categories_ = selectableCategories(categories, 'income', draft.categoryId).map((category) => ({ id: category.id, label: category.name, icon: category.icon, color: category.color }));
  return el(
    'div',
    { className: 'stack' },
    amount,
    date.element,
    section('Account', accountGrid({ accounts: selectableAccounts(accounts), selectedId: draft.accountId, ariaLabel: 'Account', onSelect: (id) => { draft.accountId = id; } })),
    section('Category', choiceGrid({ items: categories_, selectedId: draft.categoryId, ariaLabel: 'Category', onSelect: (id) => { draft.categoryId = id; } })),
  );
}

/**
 * An income that is already recorded: pick it from the list (the ones not used yet).
 * @param {{draft: object, transactions: object[], extraIncomes: object[], onChange: () => void, redraw: () => void}} config
 *   onChange = the amount changed (the split numbers update); redraw = redraw this block (the chosen row changes).
 * @returns {HTMLElement}
 */
export function linkFields({ draft, transactions, extraIncomes, onChange, redraw }) {
  const list = linkableTransactions(transactions, extraIncomes).slice(0, MAX_LINKABLE);
  if (list.length === 0) return el('p', { className: 'muted plan-hint', text: 'There is no recorded income left to link. Record new money instead.' });
  const rows = list.map((txn) =>
    listRow({
      icon: txn.id === draft.transactionId ? '✅' : '💰',
      title: txn.note || 'Income',
      subtitle: formatDayLabel(toDayKey(txn.date)),
      amount: formatMoney(txn.amount),
      amountClass: 'amount--income',
      onClick() {
        draft.transactionId = txn.id;
        redraw();
        onChange();
      },
    }),
  );
  return section('Choose the income', el('div', { className: 'list-card' }, ...rows));
}
