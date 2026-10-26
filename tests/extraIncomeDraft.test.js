import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalExtraWishes, linkableTransactions, splitRemainder } from '../src/core/extraIncome.js';
import { createExtraDraft, extraDraftToInput, draftSplit, draftAmount } from '../src/core/extraIncomeDraft.js';
import { validateExtraIncome } from '../src/core/validateExtraIncome.js';
import { makeExtraIncome, makeGiftTxn, makeTxn, localIso } from './helpers.js';

const buckets = [{ id: 'b1', name: 'Rent / needs' }, { id: 'b2', name: 'Savings' }];
const now = new Date(2026, 9, 25, 10, 30);
const filled = (patch = {}) => ({ ...createExtraDraft(buckets, now), name: 'Gift', amountText: '8000', accountId: 'a1', categoryId: 'c1', ...patch });

test('totalExtraWishes adds only the wishes parts', () => {
  assert.equal(totalExtraWishes([]), 0);
  assert.equal(totalExtraWishes([makeExtraIncome(), makeExtraIncome({ id: 'e2', wishes: 100, amount: 100, buckets: [] })]), 500100);
});

test('splitRemainder: the wishes part is what is left; too much in buckets is flagged', () => {
  assert.deepEqual(splitRemainder(800000, [300000, 0]), { wishes: 500000, overBy: 0 });
  assert.deepEqual(splitRemainder(800000, [800000]), { wishes: 0, overBy: 0 });
  assert.deepEqual(splitRemainder(800000, [500000, 400000]), { wishes: 0, overBy: 100000 });
});

test('linkableTransactions: income only, not used yet, newest first', () => {
  const a = makeTxn({ id: 'a', type: 'income', date: localIso(2026, 9, 1) });
  const b = makeTxn({ id: 'b', type: 'income', date: localIso(2026, 9, 20) });
  const spent = makeTxn({ id: 'x', type: 'expense' });
  const used = makeGiftTxn();
  assert.deepEqual(linkableTransactions([a, b, spent, used], [makeExtraIncome()]).map((txn) => txn.id), ['b', 'a']);
});

test('a new draft has one row per bucket and starts on the local date', () => {
  const draft = createExtraDraft(buckets, now);
  assert.deepEqual(draft.rows.map((row) => row.id), ['b1', 'b2']);
  assert.equal(draft.mode, 'new');
  assert.equal(draft.dateLocal, '2026-10-25T10:30');
});

test('new money: the split equals the amount, and the input is ready for the repo', () => {
  const draft = filled();
  draft.rows[1].amountText = '3000';
  const { input, problems } = extraDraftToInput(draft);
  assert.deepEqual(problems, []);
  assert.equal(input.amount, 800000);
  assert.equal(input.wishes, 500000);
  assert.deepEqual(input.buckets, [{ id: 'b2', name: 'Savings', amount: 300000 }]);
  assert.equal(input.accountId, 'a1');
  // The same numbers make a valid stored entry.
  const entry = { id: 'e', name: input.name, amount: input.amount, date: input.date, wishes: input.wishes, buckets: input.buckets, transactionId: 't', createdAt: input.date };
  assert.deepEqual(validateExtraIncome(entry), []);
});

test('no bucket amounts: everything goes to wishes', () => {
  const { input, problems } = extraDraftToInput(filled());
  assert.deepEqual(problems, []);
  assert.equal(input.wishes, 800000);
  assert.deepEqual(input.buckets, []);
});

test('buckets bigger than the amount, and missing fields, are refused with plain words', () => {
  const big = filled();
  big.rows[0].amountText = '9000';
  assert.ok(extraDraftToInput(big).problems.some((text) => text.includes('more than the full amount')));
  const empty = extraDraftToInput({ ...createExtraDraft(buckets, now) }).problems;
  for (const word of ['name', 'amount', 'account', 'category']) assert.ok(empty.some((text) => text.toLowerCase().includes(word)), word);
  assert.ok(extraDraftToInput(filled({ dateLocal: '2026-02-31T10:00' })).problems.some((text) => text.includes('date')));
});

test('linking: amount comes from the recorded income, and one must be chosen', () => {
  const txns = [makeGiftTxn()];
  const draft = filled({ mode: 'link', amountText: '1' });
  assert.ok(extraDraftToInput(draft, txns).problems.some((text) => text.includes('Choose the income')));
  draft.transactionId = 't-gift';
  draft.rows[1].amountText = '3000';
  assert.equal(draftAmount(draft, txns), 800000);
  assert.deepEqual(draftSplit(draft, txns), { wishes: 500000, overBy: 0 });
  const { input, problems } = extraDraftToInput(draft, txns);
  assert.deepEqual(problems, []);
  assert.equal(input.transactionId, 't-gift');
  assert.equal(input.amount, undefined); // the repo reads amount and date from the transaction
});
