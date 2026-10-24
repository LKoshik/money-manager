import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSpent,
  getBudgetStatus,
  getBudgetStatuses,
  WARNING_PERCENT,
} from '../src/core/budgets.js';
import { getMonthRange } from '../src/core/dates.js';
import { localIso, makeTxn } from './helpers.js';

const october = getMonthRange(2026, 9);

test('calculateSpent: only expenses of that category in that month', () => {
  const txns = [
    makeTxn({ amount: 10000 }),
    makeTxn({ amount: 5000 }),
    makeTxn({ amount: 99999, categoryId: 'fuel' }), // other category
    makeTxn({ amount: 99999, type: 'income' }), // income
    makeTxn({ amount: 99999, type: 'transfer', toAccountId: 'bank', categoryId: null }),
    makeTxn({ amount: 99999, date: localIso(2026, 8, 30) }), // September
  ];
  assert.equal(calculateSpent(txns, 'food', october), 15000);
});

test('calculateSpent: nothing spent gives 0', () => {
  assert.equal(calculateSpent([], 'food', october), 0);
});

test('getBudgetStatus: ok below 80%', () => {
  const status = getBudgetStatus({ monthlyLimit: 10000 }, 7999);
  assert.equal(status.level, 'ok');
  assert.equal(status.percent, 79);
});

test('getBudgetStatus: warning starts at exactly 80%', () => {
  assert.equal(WARNING_PERCENT, 80);
  const status = getBudgetStatus({ monthlyLimit: 10000 }, 8000);
  assert.equal(status.level, 'warning');
  assert.equal(status.percent, 80);
});

test('getBudgetStatus: exactly 100% is a warning, not over', () => {
  const status = getBudgetStatus({ monthlyLimit: 10000 }, 10000);
  assert.equal(status.level, 'warning');
  assert.equal(status.remaining, 0);
});

test('getBudgetStatus: over the limit', () => {
  const status = getBudgetStatus({ monthlyLimit: 10000 }, 15000);
  assert.equal(status.level, 'over');
  assert.equal(status.percent, 150);
  assert.equal(status.barPercent, 100);
  assert.equal(status.remaining, -5000);
});

test('getBudgetStatus: a zero limit does not divide by zero', () => {
  const status = getBudgetStatus({ monthlyLimit: 0 }, 500);
  assert.equal(status.percent, 0);
  assert.equal(status.level, 'ok');
});

test('getBudgetStatuses: one status per budget', () => {
  const budgets = [
    { id: 'b1', categoryId: 'food', monthlyLimit: 20000 },
    { id: 'b2', categoryId: 'fuel', monthlyLimit: 5000 },
  ];
  const txns = [makeTxn({ amount: 18000 }), makeTxn({ amount: 100, categoryId: 'fuel' })];
  const [food, fuel] = getBudgetStatuses(budgets, txns, october);
  assert.deepEqual([food.budgetId, food.categoryId, food.level], ['b1', 'food', 'warning']);
  assert.deepEqual([fuel.budgetId, fuel.spent, fuel.level], ['b2', 100, 'ok']);
});
