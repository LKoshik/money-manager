/** Step 2 of the Add / Edit flow: category, account(s), and the optional date and note. */

import { el } from './dom.js';
import { button } from './button.js';
import { choiceGrid } from './choiceGrid.js';
import { textField } from './formField.js';
import { ACCOUNT_TYPE_INFO } from '../core/accountList.js';
import { formatAmountText } from '../core/amountInput.js';
import { selectableAccounts, selectableCategories } from '../core/transactionDraft.js';

const TYPE_LABELS = { expense: 'Expense', income: 'Income', transfer: 'Transfer' };

const section = (title, content) =>
  el('div', { className: 'form-section' }, el('h3', { className: 'form-section-title', text: title }), content);

function accountGrid({ accounts, selectedId, onSelect, ariaLabel }) {
  const items = accounts.map((account) => ({ id: account.id, label: account.name, icon: ACCOUNT_TYPE_INFO[account.type].emoji }));
  return choiceGrid({ items, selectedId, onSelect, ariaLabel, columns: 3 });
}

/** The amount again, small, with a "Change" link back to the number pad. */
function amountSummary(draft, onEditAmount) {
  return el(
    'button',
    { className: 'amount-summary', attrs: { type: 'button', 'aria-label': 'Change amount' }, on: { click: onEditAmount } },
    el('span', { className: 'muted', text: TYPE_LABELS[draft.type] }),
    el('strong', { className: `amount-summary-value amount-display--${draft.type}`, text: `₹${formatAmountText(draft.amountText)}` }),
    el('span', { className: 'amount-summary-change', text: 'Change' }),
  );
}

function categorySection({ draft, categories, onChange, onNewCategory }) {
  const items = selectableCategories(categories, draft.type, draft.categoryId).map((category) => ({
    id: category.id,
    label: category.name,
    icon: category.icon,
    color: category.color,
  }));
  const grid = choiceGrid({
    items,
    selectedId: draft.categoryId,
    onSelect: (categoryId) => onChange({ categoryId }),
    ariaLabel: 'Category',
    action: { label: 'New', onClick: onNewCategory },
  });
  return section('Category', grid);
}

function transferSections({ draft, accounts, onChange, onCreateAccount }) {
  const list = selectableAccounts(accounts, [draft.accountId, draft.toAccountId]);
  if (list.length < 2) {
    return [
      el(
        'div',
        { className: 'stack' },
        el('p', { className: 'muted', text: 'You need two accounts to move money between them.' }),
        button({ label: 'Create account', icon: 'plus', variant: 'secondary', onClick: onCreateAccount }),
      ),
    ];
  }
  return [
    section('From', accountGrid({ accounts: list, selectedId: draft.accountId, ariaLabel: 'From account', onSelect: (accountId) => onChange({ accountId }) })),
    section('To', accountGrid({ accounts: list, selectedId: draft.toAccountId, ariaLabel: 'To account', onSelect: (toAccountId) => onChange({ toAccountId }) })),
  ];
}

function moreDetails(draft, onChange) {
  const date = textField({ label: 'Date and time', value: draft.dateLocal, attrs: { type: 'datetime-local' }, onInput: (dateLocal) => onChange({ dateLocal }) });
  const note = textField({
    label: 'Note (optional)',
    value: draft.note,
    attrs: { maxlength: '100', placeholder: 'e.g. Lunch with Ravi', autocomplete: 'off' },
    onInput: (value) => onChange({ note: value }),
  });
  return el('details', { className: 'more' }, el('summary', { text: 'Date and note' }), el('div', { className: 'stack' }, date.element, note.element));
}

/**
 * Build the details step.
 * @param {{draft: object, accounts: object[], categories: object[], onChange: (patch: object) => void,
 *   onNewCategory: () => void, onEditAmount: () => void, onCreateAccount: () => void}} config
 *   onChange gets the fields that changed. Tapping a tile does NOT redraw the form.
 * @returns {HTMLElement}
 */
export function buildTransactionForm(config) {
  const { draft, accounts, onChange, onEditAmount } = config;
  const sections =
    draft.type === 'transfer'
      ? transferSections(config)
      : [
          categorySection(config),
          section('Account', accountGrid({ accounts: selectableAccounts(accounts, [draft.accountId]), selectedId: draft.accountId, ariaLabel: 'Account', onSelect: (accountId) => onChange({ accountId }) })),
        ];
  return el('div', { className: 'stack' }, amountSummary(draft, onEditAmount), ...sections, moreDetails(draft, onChange));
}
