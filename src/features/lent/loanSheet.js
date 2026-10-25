/**
 * The New loan sheet. Step "amount": direction + number pad. Step "details": person (with chips of
 * recent names), account, date, optional due date, note. Typing never redraws the sheet.
 */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { segmented } from '../../ui/segmented.js';
import { textField, errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { buildNoAccounts, watchLists } from '../../ui/sheetSteps.js';
import { showToast } from '../../ui/toast.js';
import { store } from '../../state/store.js';
import { addLoan } from '../../state/actions.js';
import { amountStep, accountSection, dateField, noteField, section } from './loanFields.js';
import { createLoanDraft, loanDraftToInput } from '../../core/loanDraft.js';
import { selectableAccounts } from '../../core/transactionDraft.js';
import { recentPeople } from '../../core/loanList.js';
import { MAX_PERSON_LENGTH } from '../../core/validateLoans.js';

const DIRECTIONS = [
  { id: 'lent', label: 'I lent' },
  { id: 'borrowed', label: 'I borrowed' },
];

async function save(session, saveButton, errors) {
  const { input, problems } = loanDraftToInput(session.draft);
  if (problems.length > 0) return errors.show(problems);
  saveButton.disabled = true;
  try {
    await addLoan(input);
    await session.sheet.close();
    showToast('Loan added');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

function buildAmount(session) {
  const { draft } = session;
  const top = segmented({
    options: DIRECTIONS,
    value: draft.direction,
    ariaLabel: 'Lent or borrowed',
    onChange(direction) {
      draft.direction = direction;
      session.redraw();
    },
  });
  const hint = draft.direction === 'lent' ? 'How much did you give?' : 'How much did you receive?';
  return amountStep({ draft, type: draft.direction === 'lent' ? 'expense' : 'income', hint, top, onNext: () => session.go('details') });
}

function personSection(draft, errors) {
  const field = textField({ label: 'Person', value: draft.person, attrs: { maxlength: String(MAX_PERSON_LENGTH), placeholder: 'e.g. Ravi', autocomplete: 'off' }, onInput(value) { draft.person = value; errors.clear(); } });
  const chips = recentPeople(store.getState().loans).map((name) =>
    el('button', { className: 'chip', text: name, attrs: { type: 'button' }, on: { click() { draft.person = name; field.input.value = name; errors.clear(); } } }),
  );
  return el('div', { className: 'stack' }, field.element, chips.length > 0 && el('div', { className: 'chips', attrs: { role: 'group', 'aria-label': 'Recent people' } }, ...chips));
}

function buildDetails(session) {
  const { draft } = session;
  const errors = errorBox();
  const due = textField({ label: 'Due date (optional)', value: draft.dueDay, attrs: { type: 'date' }, onInput(value) { draft.dueDay = value; errors.clear(); } });
  const saveButton = button({ label: 'Save loan', block: true, onClick: () => save(session, saveButton, errors) });
  const amount = button({ label: `Amount: ₹${draft.amountText}`, variant: 'secondary', block: true, onClick: () => session.go('amount') });
  return el('div', { className: 'stack' }, personSection(draft, errors), amount, accountSection(draft, errors, draft.direction === 'lent' ? 'Paid from' : 'Received in'), section('When', el('div', { className: 'stack' }, dateField(draft, errors), due.element)), noteField(draft), errors.element, saveButton);
}

/**
 * Open the New loan sheet.
 * @param {{direction?: 'lent'|'borrowed'}} [options]  The tab the person is looking at.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openLoanSheet({ direction = 'lent' } = {}) {
  const { accounts, settings } = store.getState();
  const root = el('div', { className: 'stack' });
  const session = {
    draft: createLoanDraft({ direction, accounts, lastAccountId: settings.lastAccountId }),
    step: 'amount',
    sheet: null,
    go(step) {
      session.step = step;
      session.redraw();
    },
    redraw() {
      const noAccount = selectableAccounts(store.getState().accounts).length === 0;
      root.replaceChildren(noAccount ? buildNoAccounts() : session.step === 'amount' ? buildAmount(session) : buildDetails(session));
    },
  };
  session.redraw();
  const stop = watchLists(session);
  session.sheet = openBottomSheet({ title: 'New loan', content: root, onClose: stop });
  return session.sheet;
}
