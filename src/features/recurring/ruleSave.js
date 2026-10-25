/** Saving and deleting for the recurring sheet. */

import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { addRecurring, updateRecurring, removeRecurring } from '../../state/actions.js';
import { ruleDraftToInput } from '../../core/recurringDraft.js';

const plural = (count) => `${count} transaction${count === 1 ? '' : 's'}`;

/**
 * Check the draft and save it (new or edited). Closes the sheet when it worked;
 * otherwise shows the problems in the error box.
 * @param {{draft: object, editing: boolean, rule: object|null, sheet: {close: Function}}} session
 * @param {HTMLButtonElement} saveButton  Disabled while saving, so a double tap cannot save twice.
 * @param {{show: Function, clear: Function}} errors
 */
export async function saveRule(session, saveButton, errors) {
  const { input, problems } = ruleDraftToInput(session.draft);
  if (problems.length > 0) return errors.show(problems);
  errors.clear();
  saveButton.disabled = true;
  try {
    const { added } = session.editing ? await updateRecurring(session.rule.id, input) : await addRecurring(input);
    await session.sheet.close();
    showToast(added > 0 ? `Saved. Added ${plural(added)}` : 'Recurring saved');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

/**
 * Ask, then delete the rule being edited and close the sheet.
 * @param {{rule: object, sheet: {close: Function}}} session
 */
export async function deleteRule(session) {
  const sure = await confirmDialog({
    title: 'Delete this recurring rule?',
    message: 'Transactions it already created stay. Nothing new will be added.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeRecurring(session.rule.id);
    await session.sheet.close();
    showToast('Recurring rule deleted');
  } catch (error) {
    console.error(error);
    showToast('Could not delete. Please try again.', { kind: 'error' });
  }
}
