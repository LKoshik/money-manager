import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoanDraft, loanDraftToInput } from '../src/core/loanDraft.js';
import { createRepaymentDraft, repaymentDraftToInput } from '../src/core/repaymentDraft.js';
import { validateLoan, validateRepayment } from '../src/core/validateLoans.js';
import { makeAccount, makeLoan, makeRepayment } from './helpers.js';

const now = new Date(2026, 9, 25, 14, 30);
const filled = () => ({ ...createLoanDraft({ accounts: [makeAccount()], now }), person: ' Ravi ', amountText: '1000' });

test('a new draft starts with now, the last used account, and the chosen tab', () => {
  const draft = createLoanDraft({ direction: 'borrowed', accounts: [makeAccount(), makeAccount({ id: 'b' })], lastAccountId: 'b', now });
  assert.deepEqual(draft, { direction: 'borrowed', person: '', amountText: '', accountId: 'b', dateLocal: '2026-10-25T14:30', dueDay: '', note: '' });
});

test('a good draft becomes a valid input; the due date is 12:00 local', () => {
  const { input, problems } = loanDraftToInput({ ...filled(), dueDay: '2026-11-05', note: ' hi ' });
  assert.deepEqual(problems, []);
  assert.equal(input.person, 'Ravi');
  assert.equal(input.amount, 100000);
  assert.equal(new Date(input.dueDate).getHours(), 12);
  assert.deepEqual(validateLoan({ id: 'x', createdAt: input.date, ...input }), []);
});

test('problems are told in simple words', () => {
  const draft = { ...createLoanDraft({ now }), person: ' ', dateLocal: '', dueDay: '2026-02-31' };
  assert.equal(loanDraftToInput(draft).problems.length, 5);
  assert.match(loanDraftToInput({ ...filled(), person: 'x'.repeat(41) }).problems[0], /at most 40/);
});

test('validators refuse bad loans and repayments', () => {
  assert.ok(validateLoan(makeLoan({ direction: 'gift' })).length > 0);
  assert.ok(validateLoan(makeLoan({ amount: 0 })).length > 0);
  assert.ok(validateLoan(makeLoan({ amount: 10.5 })).length > 0);
  assert.ok(validateLoan(makeLoan({ person: '' })).length > 0);
  assert.ok(validateLoan(makeLoan({ dueDate: 'soon' })).length > 0);
  assert.deepEqual(validateLoan(makeLoan()), []);
  assert.ok(validateRepayment(makeRepayment({ amount: -5 })).length > 0);
  assert.ok(validateRepayment(makeRepayment({ loanId: '' })).length > 0);
  assert.deepEqual(validateRepayment(makeRepayment()), []);
});

test('repayment draft: starts on the loan account, refuses overpayment', () => {
  const accounts = [makeAccount(), makeAccount({ id: 'b' })];
  const draft = createRepaymentDraft({ loan: makeLoan({ accountId: 'b' }), accounts, now });
  assert.equal(draft.accountId, 'b');
  const archived = [makeAccount({ archived: true }), makeAccount({ id: 'b' })];
  assert.equal(createRepaymentDraft({ loan: makeLoan(), accounts: archived, now }).accountId, 'b');
  const ok = repaymentDraftToInput({ ...draft, amountText: '1000' }, makeLoan(), []);
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.input.amount, 100000);
  const over = repaymentDraftToInput({ ...draft, amountText: '1000.01' }, makeLoan(), []);
  assert.match(over.problems[0], /still outstanding/);
});
