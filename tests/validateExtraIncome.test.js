import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateExtraIncome, checkExtraIncomeLinks } from '../src/core/validateExtraIncome.js';
import { makeExtraIncome, makeGiftTxn, makeTxn } from './helpers.js';

const has = (problems, text) => problems.some((problem) => problem.includes(text));

test('a good entry is valid, also with everything in wishes and no buckets', () => {
  assert.deepEqual(validateExtraIncome(makeExtraIncome()), []);
  assert.deepEqual(validateExtraIncome(makeExtraIncome({ wishes: 800000, buckets: [] })), []);
  assert.deepEqual(validateExtraIncome(makeExtraIncome({ wishes: 0, buckets: [{ id: 'b2', name: 'Savings', amount: 800000 }] })), []);
});

test('the split must equal the full amount (one paisa off is refused)', () => {
  assert.ok(has(validateExtraIncome(makeExtraIncome({ wishes: 500001 })), 'add up to the full amount'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ wishes: 499999 })), 'add up to the full amount'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ buckets: [] })), 'add up to the full amount'));
});

test('bad fields are refused', () => {
  assert.ok(has(validateExtraIncome(makeExtraIncome({ name: ' ' })), 'name'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ amount: 0, wishes: 0, buckets: [] })), 'amount'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ date: 'x' })), 'date'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ wishes: -5 })), 'wishes'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ transactionId: '' })), 'transactionId'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ buckets: 'no' })), 'buckets'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ buckets: [{ id: 'b', name: 'A', amount: 0 }] })), 'split part amount'));
  assert.ok(has(validateExtraIncome(makeExtraIncome({ buckets: [{ id: 'b', name: 'A', amount: 100000 }, { id: 'b', name: 'B', amount: 200000 }] })), 'used twice'));
  assert.equal(validateExtraIncome(null).length, 1);
});

test('links: the transaction must exist, be income, and be used once', () => {
  const ok = [];
  checkExtraIncomeLinks([makeExtraIncome()], [makeGiftTxn()], ok);
  assert.deepEqual(ok, []);
  const missing = [];
  checkExtraIncomeLinks([makeExtraIncome()], [], missing);
  assert.ok(has(missing, 'not found'));
  const expense = [];
  checkExtraIncomeLinks([makeExtraIncome()], [makeTxn({ id: 't-gift', type: 'expense' })], expense);
  assert.ok(has(expense, 'not found'));
  const twice = [];
  checkExtraIncomeLinks([makeExtraIncome(), makeExtraIncome({ id: 'e2' })], [makeGiftTxn()], twice);
  assert.ok(has(twice, 'used by another entry'));
});
