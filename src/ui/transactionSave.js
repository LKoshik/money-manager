/** Saving and deleting for the transaction sheet. */

import { confirmDialog } from './modal.js';
import { showToast } from './toast.js';
import { store } from '../state/store.js';
import { addTransaction, updateTransaction, deleteTransaction, rememberAccount } from '../state/actions.js';
import { draftToInput } from '../core/transactionDraft.js';

/** Remember the account for next time. Not important, so a failure is ignored. */
function rememberLast(accountId) {
  if (store.getState().settings.lastAccountId === accountId) return Promise.resolve();
  return rememberAccount(accountId).catch((error) => console.error(error));
}

/**
 * Check the draft and save it (new or edited). Closes the sheet when it worked;
 * otherwise shows the problems in the error box.
 * @param {{draft: object, editing: boolean, transaction: object|null, sheet: {close: Function}}} session
 * @param {HTMLButtonElement} saveButton  Disabled while saving, so a double tap cannot save twice.
 * @param {{show: Function, clear: Function}} errors
 */
export async function saveDraft(session, saveButton, errors) {
  const { input, problems } = draftToInput(session.draft);
  if (problems.length > 0) return errors.show(problems);
  errors.clear();
  saveButton.disabled = true;
  try {
    if (session.editing) await updateTransaction(session.transaction.id, input);
    else await addTransaction(input);
    if (!session.editing) await rememberLast(input.accountId);
    await session.sheet.close();
    showToast(session.editing ? 'Changes saved' : 'Transaction saved');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

/**
 * Ask, then delete the transaction being edited and close the sheet.
 * @param {{transaction: object, sheet: {close: Function}}} session
 */
export async function removeTransaction(session) {
  const sure = await confirmDialog({
    title: 'Delete this transaction?',
    message: 'This cannot be undone.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await deleteTransaction(session.transaction.id);
    await session.sheet.close();
    showToast('Transaction deleted');
  } catch (error) {
    console.error(error);
    showToast('Could not delete. Please try again.', { kind: 'error' });
  }
}
