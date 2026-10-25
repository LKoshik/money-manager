/**
 * The Add / Edit recurring sheet. Like the transaction sheet: step 1 = type, amount;
 * step 2 = category, account, name, repeat, start and end day. Editing opens on step 2.
 */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { buildTransactionForm } from '../../ui/transactionForm.js';
import { buildAmountStep, buildNoAccounts, formHandlers, watchLists } from '../../ui/sheetSteps.js';
import { store } from '../../state/store.js';
import { selectableAccounts } from '../../core/transactionDraft.js';
import { createRuleDraft } from '../../core/recurringDraft.js';
import { ruleDetails } from './ruleDetails.js';
import { saveRule, deleteRule } from './ruleSave.js';

function buildDetailsStep(session) {
  const { accounts, categories } = store.getState();
  const errors = errorBox();
  const handlers = formHandlers(session, errors);
  const form = buildTransactionForm({
    draft: session.draft,
    accounts,
    categories,
    ...handlers,
    details: ruleDetails(session, handlers.onChange),
  });
  const save = button({ label: session.editing ? 'Save changes' : 'Save', block: true, onClick: () => saveRule(session, save, errors) });
  const remove = session.editing && button({ label: 'Delete', variant: 'danger', block: true, onClick: () => deleteRule(session) });
  return el('div', { className: 'stack' }, form, errors.element, save, remove);
}

function buildStep(session) {
  if (!session.editing && selectableAccounts(store.getState().accounts).length === 0) return buildNoAccounts();
  return session.step === 'amount' ? buildAmountStep(session) : buildDetailsStep(session);
}

/**
 * Open the sheet.
 * @param {{rule?: object|null}} [options]  Give a rule to edit it.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openRuleSheet({ rule = null } = {}) {
  const { accounts, settings } = store.getState();
  const root = el('div', { className: 'txn-sheet' });
  const session = {
    editing: rule !== null,
    rule,
    step: rule ? 'details' : 'amount',
    draft: createRuleDraft({ rule, accounts, lastAccountId: settings.lastAccountId }),
    sheet: null,
    redraw: () => root.replaceChildren(buildStep(session)),
  };
  session.redraw();
  const stopWatching = watchLists(session);
  session.sheet = openBottomSheet({ title: rule ? 'Edit recurring' : 'New recurring', content: root, onClose: stopWatching });
  return session.sheet;
}
