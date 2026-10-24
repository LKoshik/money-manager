import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_FILTERS, filterTransactions, countActiveFilters, hasActiveFilters,
} from '../src/core/transactionFilter.js';
import { makeTxn, makeCategory, localIso } from './helpers.js';

const categories = [makeCategory(), makeCategory({ id: 'salary', name: 'Salary', kind: 'income' })];
const now = new Date(2026, 9, 20, 12);
const lunch = makeTxn({ id: 'lunch', note: 'Lunch with Ravi', amount: 25050, tags: ['work'] });
const pay = makeTxn({ id: 'pay', type: 'income', categoryId: 'salary', amount: 5000000, accountId: 'bank', date: localIso(2026, 8, 30) });
const move = makeTxn({ id: 'move', type: 'transfer', categoryId: null, toAccountId: 'bank', amount: 100000 });
const all = [lunch, pay, move];
const run = (filters) => filterTransactions(all, { ...EMPTY_FILTERS, ...filters }, { categories }, now).map((t) => t.id);

test('no filters keeps everything in the same order', () => {
  assert.deepEqual(run({}), ['lunch', 'pay', 'move']);
});

test('search: note, category name and tag, ignoring case and spaces', () => {
  assert.deepEqual(run({ query: ' RAVI ' }), ['lunch']);
  assert.deepEqual(run({ query: 'salary' }), ['pay']);
  assert.deepEqual(run({ query: 'wor' }), ['lunch']);
});

test('search: exact amount only', () => {
  assert.deepEqual(run({ query: '250.50' }), ['lunch']);
  assert.deepEqual(run({ query: '250.5' }), ['lunch']);
  assert.deepEqual(run({ query: '250' }), []);
  assert.deepEqual(run({ query: '1000' }), ['move']);
});

test('filter by type, category and date', () => {
  assert.deepEqual(run({ type: 'income' }), ['pay']);
  assert.deepEqual(run({ categoryId: 'food' }), ['lunch']); // a transfer has no category
  assert.deepEqual(run({ datePreset: 'thisMonth' }), ['lunch', 'move']);
});

test('filter by account: a transfer belongs to both accounts', () => {
  assert.deepEqual(run({ accountId: 'bank' }), ['pay', 'move']);
  assert.deepEqual(run({ accountId: 'cash' }), ['lunch', 'move']);
});

test('filters work together', () => {
  assert.deepEqual(run({ accountId: 'cash', type: 'expense', query: 'lunch' }), ['lunch']);
  assert.deepEqual(run({ accountId: 'bank', type: 'expense' }), []);
});

test('countActiveFilters ignores the search text; hasActiveFilters does not', () => {
  assert.equal(countActiveFilters(EMPTY_FILTERS), 0);
  assert.equal(countActiveFilters({ ...EMPTY_FILTERS, query: 'x', type: 'income', datePreset: 'thisMonth' }), 2);
  assert.equal(hasActiveFilters(EMPTY_FILTERS), false);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, query: ' a ' }), true);
  assert.equal(hasActiveFilters({ ...EMPTY_FILTERS, query: '  ' }), false);
});
