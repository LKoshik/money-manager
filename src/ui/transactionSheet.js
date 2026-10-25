/**
 * The Add / Edit transaction sheet. Two steps in one bottom sheet:
 *   1. type switch + amount + number pad      2. category / account / save
 * Editing opens straight on step 2. Android Back closes the whole sheet.
 * It lives in ui/ because both History and Home open it (features may not
 * import each other).
 */

import { el } from './dom.js';
import { button } from './button.js';
import { buildTransactionForm } from './transactionForm.js';
import { errorBox } from './formField.js';
import { openBottomSheet } from './bottomSheet.js';
import { saveDraft, removeTransaction } from './transactionSave.js';
import { buildAmountStep, buildNoAccounts, formHandlers, watchLists } from './sheetSteps.js';
import { store } from '../state/store.js';
import { createDraft, selectableAccounts } from '../core/transactionDraft.js';

function buildDetailsStep(session) {
  const { accounts, categories } = store.getState();
  const errors = errorBox();
  const form = buildTransactionForm({ draft: session.draft, accounts, categories, ...formHandlers(session, errors) });
  const save = button({ label: session.editing ? 'Save changes' : 'Save', block: true, onClick: () => saveDraft(session, save, errors) });
  const remove = session.editing && button({ label: 'Delete', variant: 'danger', block: true, onClick: () => removeTransaction(session) });
  return el('div', { className: 'stack' }, form, errors.element, save, remove);
}

function buildStep(session) {
  const { accounts } = store.getState();
  if (!session.editing && selectableAccounts(accounts).length === 0) return buildNoAccounts();
  return session.step === 'amount' ? buildAmountStep(session) : buildDetailsStep(session);
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
