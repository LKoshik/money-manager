import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupCategories, describeUses } from '../src/core/categoryGroups.js';
import { makeCategory, makeTxn } from './helpers.js';

const cats = [
  makeCategory({ id: 'b', name: 'Bills' }),
  makeCategory({ id: 'a', name: 'Auto' }),
  makeCategory({ id: 's', name: 'Salary', kind: 'income' }),
  makeCategory({ id: 'o', name: 'Old', archived: true }),
  makeCategory({ id: 'oi', name: 'Old income', kind: 'income', archived: true }),
];

test('groupCategories: splits by kind and archived, A to Z', () => {
  const groups = groupCategories(cats, []);
  assert.deepEqual(groups.expense.map((r) => r.category.name), ['Auto', 'Bills']);
  assert.deepEqual(groups.income.map((r) => r.category.name), ['Salary']);
  assert.deepEqual(groups.archived.map((r) => r.category.name), ['Old', 'Old income']);
});

test('groupCategories: counts uses per category', () => {
  const txns = [makeTxn({ categoryId: 'a' }), makeTxn({ categoryId: 'a' }), makeTxn({ type: 'transfer', categoryId: null })];
  const groups = groupCategories(cats, txns);
  assert.equal(groups.expense[0].uses, 2);
  assert.equal(groups.expense[1].uses, 0);
});

test('groupCategories: empty input', () => {
  assert.deepEqual(groupCategories([], []), { expense: [], income: [], archived: [] });
});

test('describeUses: words', () => {
  assert.equal(describeUses(0), 'No transactions');
  assert.equal(describeUses(1), '1 transaction');
  assert.equal(describeUses(12), '12 transactions');
});
