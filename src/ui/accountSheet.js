/**
 * The account sheet: add a new account, or edit / archive / delete one.
 * It lives in ui/ because the Accounts screen, the Add flow and (later) Home all open it.
 */

import { el } from './dom.js';
import { button } from './button.js';
import { choiceGrid } from './choiceGrid.js';
import { textField, errorBox } from './formField.js';
import { openBottomSheet } from './bottomSheet.js';
import { confirmDialog } from './modal.js';
import { showToast } from './toast.js';
import { addAccount, updateAccount, removeAccount } from '../state/actions.js';
import { ACCOUNT_TYPES, MAX_NAME_LENGTH } from '../core/validate.js';
import { ACCOUNT_TYPE_INFO } from '../core/accountList.js';
import { sanitizeAmount } from '../core/amountInput.js';
import { createAccountDraft, accountDraftToInput, balanceLabel } from '../core/accountDraft.js';

async function save(session, saveButton) {
  const { input, problems } = accountDraftToInput(session.draft);
  if (problems.length > 0) return session.errors.show(problems);
  saveButton.disabled = true;
  try {
    if (session.account) await updateAccount(session.account.id, input);
    else await addAccount(input);
    await session.sheet.close();
    showToast(session.account ? 'Account updated' : 'Account added');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    session.errors.show(['Could not save. Please try again.']);
  }
}

async function setArchived(session, archived) {
  try {
    await updateAccount(session.account.id, { archived });
    await session.sheet.close();
    showToast(archived ? 'Account archived' : 'Account restored');
  } catch (error) {
    console.error(error);
    showToast('Something went wrong. Please try again.', { kind: 'error' });
  }
}

async function deleteAccount(session) {
  const sure = await confirmDialog({
    title: 'Delete this account?',
    message: 'If it has transactions it is archived instead, so your history stays correct.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    const result = await removeAccount(session.account.id);
    await session.sheet.close();
    showToast(result === 'deleted' ? 'Account deleted' : 'It has transactions, so it was archived instead');
  } catch (error) {
    console.error(error);
    showToast('Something went wrong. Please try again.', { kind: 'error' });
  }
}

function buildFields(session) {
  const { draft, errors } = session;
  const name = textField({
    label: 'Name',
    value: draft.name,
    attrs: { maxlength: String(MAX_NAME_LENGTH), placeholder: 'e.g. Cash, HDFC savings', autocomplete: 'off' },
    onInput(value) {
      draft.name = value;
      errors.clear();
    },
  });
  const balance = textField({
    label: balanceLabel(draft.type),
    value: draft.balanceText,
    attrs: { inputmode: 'decimal', placeholder: '0', autocomplete: 'off' },
    onInput(value) {
      draft.balanceText = sanitizeAmount(value);
      if (draft.balanceText !== value) balance.input.value = draft.balanceText;
      errors.clear();
    },
  });
  const types = choiceGrid({
    items: ACCOUNT_TYPES.map((type) => ({ id: type, label: ACCOUNT_TYPE_INFO[type].label, icon: ACCOUNT_TYPE_INFO[type].emoji })),
    selectedId: draft.type,
    columns: 2,
    ariaLabel: 'Account type',
    onSelect(type) {
      draft.type = type;
      balance.labelNode.textContent = balanceLabel(type);
    },
  });
  return [name.element, types, balance.element];
}

function buildForm(session) {
  const saveButton = button({ label: 'Save', block: true, onClick: () => save(session, saveButton) });
  const { account } = session;
  const archive = account && button({ label: account.archived ? 'Restore account' : 'Archive account', variant: 'secondary', block: true, onClick: () => setArchived(session, !account.archived) });
  const remove = account && button({ label: 'Delete account', variant: 'danger', block: true, onClick: () => deleteAccount(session) });
  return el('div', { className: 'stack' }, ...buildFields(session), session.errors.element, saveButton, archive, remove);
}

/**
 * Open the account sheet.
 * @param {{account?: object|null}} [options]  Give an account to edit it; give none to add a new one.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openAccountSheet({ account = null } = {}) {
  const session = { account, draft: createAccountDraft(account), errors: errorBox(), sheet: null };
  session.sheet = openBottomSheet({ title: account ? 'Edit account' : 'New account', content: buildForm(session) });
  return session.sheet;
}
