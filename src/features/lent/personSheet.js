/**
 * The sheet of ONE person: all their loans (of one direction) with repayments. It redraws when
 * loans or repayments change, and closes itself when the person has no loan left.
 */

import { el } from '../../ui/dom.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { store } from '../../state/store.js';
import { loanCard } from './loanCard.js';
import { openRepaymentSheet } from './repaymentSheet.js';
import { deleteLoan, deleteRepayment } from './loanCommands.js';
import { buildLoanRows, buildPeople } from '../../core/loanList.js';
import { headerText } from '../../core/loanText.js';

function buildContent(session) {
  const { loans, repayments, accounts } = store.getState();
  const person = buildPeople(buildLoanRows(loans, repayments), session.direction).find((item) => item.key === session.key);
  if (!person) {
    if (session.sheet && !session.closing) {
      session.closing = true; // the last loan was deleted: nothing left to show
      session.sheet.close();
    }
    return el('div');
  }
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const accountName = (id) => names.get(id) ?? 'Deleted account';
  const cards = person.rows.map((row) =>
    loanCard(row, {
      accountName,
      now: new Date(),
      onRepay: () => openRepaymentSheet(row.loan.id),
      onDeleteLoan: () => deleteLoan(row.loan, row.repayments.length),
      onDeleteRepayment: deleteRepayment,
    }),
  );
  const total = person.settled ? 'All settled' : headerText(session.direction, person.outstanding);
  return el('div', { className: 'stack' }, el('p', { className: 'muted lent-hint', text: total }), ...cards);
}

/**
 * Open the sheet of a person.
 * @param {'lent'|'borrowed'} direction
 * @param {string} key  The person's key from buildPeople() (lower case name).
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openPersonSheet(direction, key) {
  const root = el('div', { className: 'stack' });
  const session = { direction, key, sheet: null, closing: false, redraw: () => root.replaceChildren(buildContent(session)) };
  session.redraw();
  let seen = store.getState();
  const stop = store.subscribe((state) => {
    if (state.loans === seen.loans && state.repayments === seen.repayments && state.accounts === seen.accounts) return;
    seen = state;
    session.redraw();
  });
  const name = buildPeople(buildLoanRows(seen.loans, seen.repayments), direction).find((item) => item.key === key)?.name ?? 'Loans';
  session.sheet = openBottomSheet({ title: name, content: root, onClose: stop });
  return session.sheet;
}
