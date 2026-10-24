/**
 * The Add / Edit transaction sheet. Two steps in one bottom sheet:
 *   1. type switch + amount + number pad      2. category / account / save
 * Editing opens straight on step 2. Android Back closes the whole sheet.
 * It lives in ui/ because both History and Home open it (features may not
 * import each other).
 */

import { el } from './dom.js';
import { button } from './button.js';
import { emptyState } from './emptyState.js';
import { segmented } from './segmented.js';
import { amountField } from './amountField.js';
import { buildTransactionForm } from './transactionForm.js';
import { errorBox } from './formField.js';
import { openBottomSheet } from './bottomSheet.js';
import { saveDraft, removeTransaction } from './transactionSave.js';
import { openAccountSheet } from './accountSheet.js';
import { openCategorySheet } from './categorySheet.js';
import { store } from '../state/store.js';
import {
  createDraft, changeDraftType, hasAmount, pickDefaultAccount, selectableAccounts,
} from '../core/transactionDraft.js';

const TYPE_OPTIONS = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
];

function goTo(session, step) {
  session.step = step;
  session.redraw();
}

function buildAmountStep(session) {
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

function buildDetailsStep(session) {
  const { accounts, categories } = store.getState();
  const errors = errorBox();
  const form = buildTransactionForm({
    draft: session.draft,
    accounts,
    categories,
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
  });
  const save = button({ label: session.editing ? 'Save changes' : 'Save', block: true, onClick: () => saveDraft(session, save, errors) });
  const remove = session.editing && button({ label: 'Delete', variant: 'danger', block: true, onClick: () => removeTransaction(session) });
  return el('div', { className: 'stack' }, form, errors.element, save, remove);
}

function buildNoAccounts() {
  return emptyState({
    icon: 'wallet',
    title: 'Add an account first',
    message: 'Money has to live somewhere. Create your first account, for example Cash.',
    action: { label: 'Create account', icon: 'plus', onClick: () => openAccountSheet() },
  });
}

function buildStep(session) {
  const { accounts } = store.getState();
  if (!session.editing && selectableAccounts(accounts).length === 0) return buildNoAccounts();
  return session.step === 'amount' ? buildAmountStep(session) : buildDetailsStep(session);
}

/** Redraw when accounts or categories change (a new one was just created). */
function watchLists(session) {
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

/**
 * Open the sheet.
 * @param {{transaction?: object|null}} [options]  Give a transaction to edit it.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openTransactionSheet({ transaction = null } = {}) {
  const { accounts, settings } = store.getState();
  const root = el('div', { className: 'txn-sheet' });
  const session = {
    editing: transaction !== null,
    transaction,
    step: transaction ? 'details' : 'amount',
    draft: createDraft({ transaction, accounts, lastAccountId: settings.lastAccountId }),
    sheet: null,
    redraw: () => root.replaceChildren(buildStep(session)),
  };
  session.redraw();
  const stopWatching = watchLists(session);
  session.sheet = openBottomSheet({ title: transaction ? 'Edit transaction' : 'Add transaction', content: root, onClose: stopWatching });
  return session.sheet;
}
