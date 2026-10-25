/**
 * Pieces shared by the sheets that add or edit a money entry (a transaction or a
 * recurring rule): the amount step, the "add an account first" message, the form
 * handlers, and the redraw when accounts or categories change.
 * A "session" is the sheet's own state: {draft, editing, step, sheet, redraw}.
 */

import { el } from './dom.js';
import { button } from './button.js';
import { emptyState } from './emptyState.js';
import { segmented } from './segmented.js';
import { amountField } from './amountField.js';
import { openAccountSheet } from './accountSheet.js';
import { openCategorySheet } from './categorySheet.js';
import { store } from '../state/store.js';
import { changeDraftType, hasAmount, pickDefaultAccount } from '../core/transactionDraft.js';

const TYPE_OPTIONS = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
];

/** Go to another step of the sheet. @param {object} session @param {'amount'|'details'} step */
export function goTo(session, step) {
  session.step = step;
  session.redraw();
}

/**
 * Step 1: type switch, amount, number pad.
 * @param {object} session
 * @returns {HTMLElement}
 */
export function buildAmountStep(session) {
  const done = button({
    label: session.editing ? 'Done' : 'Next',
    block: true,
    disabled: !hasAmount(session.draft.amountText),
    onClick: () => goTo(session, 'details'),
  });
  const field = amountField({
    text: session.draft.amountText,
    type: session.draft.type,
    onChange(amountText) {
      session.draft = { ...session.draft, amountText };
      done.disabled = !hasAmount(amountText);
    },
  });
  const types = segmented({
    options: TYPE_OPTIONS,
    value: session.draft.type,
    ariaLabel: 'Transaction type',
    onChange(type) {
      session.draft = changeDraftType(session.draft, type, store.getState().accounts);
      session.redraw();
    },
  });
  return el('div', { className: 'stack' }, types, field, done);
}

/** @returns {HTMLElement} The message shown when there is no account yet. */
export function buildNoAccounts() {
  return emptyState({
    icon: 'wallet',
    title: 'Add an account first',
    message: 'Money has to live somewhere. Create your first account, for example Cash.',
    action: { label: 'Create account', icon: 'plus', onClick: () => openAccountSheet() },
  });
}

/**
 * The callbacks buildTransactionForm needs.
 * @param {object} session
 * @param {{clear: () => void}} errors  The sheet's error box.
 * @returns {{onChange: Function, onEditAmount: Function, onCreateAccount: Function, onNewCategory: Function}}
 */
export function formHandlers(session, errors) {
  return {
    onChange(patch) {
      session.draft = { ...session.draft, ...patch };
      errors.clear();
    },
    onEditAmount: () => goTo(session, 'amount'),
    onCreateAccount: () => openAccountSheet(),
    onNewCategory: () =>
      openCategorySheet({
        kind: session.draft.type,
        onCreated(category) {
          session.draft = { ...session.draft, categoryId: category.id };
          session.redraw();
        },
      }),
  };
}

/**
 * Redraw the sheet when accounts or categories change (a new one was just created).
 * @param {object} session
 * @returns {() => void} Stops listening. Pass it to the sheet's onClose.
 */
export function watchLists(session) {
  let seen = store.getState();
  return store.subscribe((state) => {
    if (state.accounts === seen.accounts && state.categories === seen.categories) return;
    seen = state;
    if (!session.draft.accountId) {
      session.draft = { ...session.draft, accountId: pickDefaultAccount(state.accounts, state.settings.lastAccountId) };
    }
    session.redraw();
  });
}
