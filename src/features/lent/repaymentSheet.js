/** The Add repayment sheet. Step "amount": number pad. Step "details": account, date, note. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { buildNoAccounts, watchLists } from '../../ui/sheetSteps.js';
import { showToast } from '../../ui/toast.js';
import { store } from '../../state/store.js';
import { addRepayment } from '../../state/actions.js';
import { amountStep, accountSection, dateField, noteField, section } from './loanFields.js';
import { createRepaymentDraft, repaymentDraftToInput } from '../../core/repaymentDraft.js';
import { outstandingOf } from '../../core/loanModel.js';
import { selectableAccounts } from '../../core/transactionDraft.js';
import { formatMoney } from '../../core/money.js';

const loanState = (loanId) => {
  const { loans, repayments } = store.getState();
  return { loan: loans.find((item) => item.id === loanId), mine: repayments.filter((item) => item.loanId === loanId) };
};

async function save(session, saveButton, errors) {
  const { loan, mine } = loanState(session.loanId);
  if (!loan) return errors.show(['This loan no longer exists.']);
  const { input, problems } = repaymentDraftToInput(session.draft, loan, mine); // friendly message before saving
  if (problems.length > 0) return errors.show(problems);
  saveButton.disabled = true;
  try {
    const { settled } = await addRepayment(input);
    await session.sheet.close();
    showToast(settled ? 'Loan settled' : 'Repayment added');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show([error.message?.includes('outstanding') ? error.message : 'Could not save. Please try again.']);
  }
}

function buildDetails(session, loan) {
  const errors = errorBox();
  const label = loan.direction === 'lent' ? 'Received in' : 'Paid from';
  const saveButton = button({ label: 'Save repayment', block: true, onClick: () => save(session, saveButton, errors) });
  const amount = button({ label: `Amount: ₹${session.draft.amountText}`, variant: 'secondary', block: true, onClick: () => session.go('amount') });
  return el('div', { className: 'stack' }, amount, accountSection(session.draft, errors, label), section('When', dateField(session.draft, errors)), noteField(session.draft), errors.element, saveButton);
}

/**
 * Open the Add repayment sheet of a loan.
 * @param {string} loanId
 * @returns {{close: () => Promise<void>, element: HTMLElement}|undefined}
 */
export function openRepaymentSheet(loanId) {
  const { loan, mine } = loanState(loanId);
  if (!loan) return undefined;
  const root = el('div', { className: 'stack' });
  const session = {
    loanId,
    draft: createRepaymentDraft({ loan, accounts: store.getState().accounts }),
    step: 'amount',
    sheet: null,
    go(step) {
      session.step = step;
      session.redraw();
    },
    redraw() {
      if (selectableAccounts(store.getState().accounts).length === 0) return root.replaceChildren(buildNoAccounts());
      const hint = `${formatMoney(outstandingOf(loan, mine))} is still outstanding`;
      const type = loan.direction === 'lent' ? 'income' : 'expense';
      root.replaceChildren(session.step === 'amount' ? amountStep({ draft: session.draft, type, hint, onNext: () => session.go('details') }) : buildDetails(session, loan));
    },
  };
  session.redraw();
  const stop = watchLists(session);
  session.sheet = openBottomSheet({ title: 'Add repayment', content: root, onClose: stop });
  return session.sheet;
}
