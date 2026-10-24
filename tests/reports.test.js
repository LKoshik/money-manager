import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPeriodTotals,
  getSpendingByCategory,
  getIncomeVsExpenseByMonth,
  UNCATEGORIZED,
} from '../src/core/reports.js';
import { getMonthRange } from '../src/core/dates.js';
import { localIso, makeTxn } from './helpers.js';

const october = getMonthRange(2026, 9);

test('getPeriodTotals: sums income and expense, ignores transfers and other months', () => {
  const txns = [
    makeTxn({ type: 'income', amount: 50000 }),
    makeTxn({ type: 'expense', amount: 12000 }),
    makeTxn({ type: 'transfer', amount: 77777, toAccountId: 'bank', categoryId: null }),
    makeTxn({ type: 'income', amount: 88888, date: localIso(2026, 8, 20) }),
  ];
  assert.deepEqual(getPeriodTotals(txns, october), { income: 50000, expense: 12000, net: 38000 });
});

test('getPeriodTotals: empty gives zeros', () => {
  assert.deepEqual(getPeriodTotals([], october), { income: 0, expense: 0, net: 0 });
});

test('getSpendingByCategory: biggest first, with shares', () => {
  const txns = [
    makeTxn({ amount: 2000, categoryId: 'food' }),
    makeTxn({ amount: 1000, categoryId: 'food' }),
    makeTxn({ amount: 5000, categoryId: 'fuel' }),
    makeTxn({ amount: 2000, categoryId: 'fun' }),
  ];
  const result = getSpendingByCategory(txns, october);
  assert.deepEqual(result.map((r) => r.categoryId), ['fuel', 'food', 'fun']);
  assert.deepEqual(result.map((r) => r.total), [5000, 3000, 2000]);
  assert.equal(result[2].share, 0.2);
});

test('getSpendingByCategory: transfers, income and other months are left out', () => {
  const txns = [
    makeTxn({ amount: 1000 }),
    makeTxn({ type: 'transfer', amount: 5000, toAccountId: 'bank', categoryId: null }),
    makeTxn({ type: 'income', amount: 9000, categoryId: 'salary' }),
    makeTxn({ amount: 7000, date: localIso(2026, 10, 2) }),
  ];
  assert.deepEqual(getSpendingByCategory(txns, october), [
    { categoryId: 'food', total: 1000, share: 1 },
  ]);
});

test('getSpendingByCategory: an expense without category is grouped safely', () => {
  const result = getSpendingByCategory([makeTxn({ categoryId: null })], october);
  assert.equal(result[0].categoryId, UNCATEGORIZED);
});

test('getSpendingByCategory: empty gives an empty list', () => {
  assert.deepEqual(getSpendingByCategory([], october), []);
});

test('getIncomeVsExpenseByMonth: fills empty months with zeros, keeps order', () => {
  const txns = [
    makeTxn({ type: 'income', amount: 40000, date: localIso(2026, 7, 5) }),
    makeTxn({ type: 'expense', amount: 10000, date: localIso(2026, 9, 5) }),
    makeTxn({ type: 'expense', amount: 2500, date: localIso(2026, 9, 25) }),
    makeTxn({ type: 'transfer', amount: 99999, toAccountId: 'bank', date: localIso(2026, 9, 6) }),
    makeTxn({ type: 'expense', amount: 55555, date: localIso(2026, 4, 1) }), // outside the list
  ];
  assert.deepEqual(getIncomeVsExpenseByMonth(txns, ['2026-08', '2026-09', '2026-10']), [
    { key: '2026-08', income: 40000, expense: 0 },
    { key: '2026-09', income: 0, expense: 0 },
    { key: '2026-10', income: 0, expense: 12500 },
  ]);
});
