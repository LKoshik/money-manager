import { test } from 'node:test';
import assert from 'node:assert/strict';
import { outstandingOf, daysToDue, repaidAmount } from '../src/core/loanModel.js';
import { checkNewRepayment, checkLoanAmount } from '../src/core/loanRules.js';
import { dueText, owedLine, headerText, personSubtitle, loanTitle } from '../src/core/loanText.js';
import { makeLoan, makeRepayment, localIso } from './helpers.js';

const now = new Date(2026, 9, 25, 23, 30); // 25 Oct 2026, late evening, local time

test('outstanding = loan - repayments, and settled at 0', () => {
  assert.equal(outstandingOf(makeLoan(), []), 100000);
  assert.equal(outstandingOf(makeLoan(), [makeRepayment(), makeRepayment({ id: 'p2', amount: 20000 })]), 50000);
  assert.equal(repaidAmount([]), 0);
  assert.equal(outstandingOf(makeLoan(), [makeRepayment({ amount: 100000 })]), 0);
});

test('a repayment cannot be above outstanding, zero, or on a settled loan', () => {
  const repayments = [makeRepayment({ amount: 90000 })];
  assert.deepEqual(checkNewRepayment(makeLoan(), repayments, 10000), []);
  assert.match(checkNewRepayment(makeLoan(), repayments, 10001)[0], /Only ₹100\.00 is still outstanding/);
  assert.match(checkNewRepayment(makeLoan(), [], 0)[0], /greater than zero/);
  assert.match(checkNewRepayment(makeLoan(), [], null)[0], /greater than zero/);
  assert.match(checkNewRepayment(makeLoan(), [makeRepayment({ amount: 100000 })], 1)[0], /already settled/);
});

test('a loan cannot become smaller than what is repaid', () => {
  assert.deepEqual(checkLoanAmount([makeRepayment()], 30000), []);
  assert.equal(checkLoanAmount([makeRepayment()], 29999).length, 1);
});

test('daysToDue counts local days: same day 0, past negative, future positive, none/settled null', () => {
  const due = (day) => makeLoan({ dueDate: localIso(2026, 9, day) });
  assert.equal(daysToDue(due(25), 1, now), 0);
  assert.equal(daysToDue(due(30), 1, now), 5);
  assert.equal(daysToDue(due(22), 1, now), -3);
  assert.equal(daysToDue(makeLoan(), 1, now), null);
  assert.equal(daysToDue(due(22), 0, now), null);
});

test('daysToDue is right across the daylight-saving change and month ends', () => {
  const march = new Date(2026, 2, 28, 12);
  assert.equal(daysToDue(makeLoan({ dueDate: localIso(2026, 3, 2) }), 1, march), 5);
  assert.equal(daysToDue(makeLoan({ dueDate: localIso(2027, 0, 1) }), 1, new Date(2026, 11, 31, 1)), 1);
});

test('texts: due, header, home line, person row, loan title', () => {
  assert.equal(dueText(-3), 'Overdue 3 days');
  assert.equal(dueText(-1), 'Overdue 1 day');
  assert.equal(dueText(0), 'Due today');
  assert.equal(dueText(5), 'Due in 5 days');
  assert.equal(dueText(null), '');
  assert.equal(headerText('lent', 150000), '₹1,500.00 still to get back');
  assert.equal(headerText('borrowed', 50000), '₹500.00 still to pay');
  assert.equal(owedLine({ toYou: 0, youOwe: 0 }), null);
  assert.equal(owedLine({ toYou: 100000, youOwe: 0 }), 'Owed to you ₹1,000.00 · You owe ₹0.00');
  assert.equal(personSubtitle({ settled: true, openCount: 0 }, null), 'Settled');
  assert.equal(personSubtitle({ settled: false, openCount: 2 }, -2), '2 loans · Overdue 2 days');
  assert.equal(loanTitle(makeLoan({ direction: 'borrowed' })), 'Borrowed ₹1,000.00');
});
