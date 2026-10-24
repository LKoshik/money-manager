import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBudgetList, getBudgetableCategories, summarizeRows, formatRemaining, formatSpentOfLimit,
} from '../src/core/budgetList.js';
import { getMonthRange } from '../src/core/dates.js';
import { localIso, makeTxn, makeCategory, makeBudget } from './helpers.js';

const october = getMonthRange(2026, 9);
const food = makeCategory({ id: 'food', name: 'Food' });
const fuel = makeCategory({ id: 'fuel', name: 'Fuel' });
const rent = makeCategory({ id: 'rent', name: 'Rent' });
const salary = makeCategory({ id: 'salary', name: 'Salary', kind: 'income' });
const build = (data) => buildBudgetList({ categories: [], budgets: [], transactions: [], ...data }, october);

test('empty data gives empty lists and no summary', () => {
  assert.deepEqual(build({}), { rows: [], unbudgeted: [], summary: null });
});

test('a row has the status for the month; other months, income and transfers do not count', () => {
  const transactions = [
    makeTxn({ amount: 20000 }),
    makeTxn({ amount: 30000, date: localIso(2026, 9, 31, 23) }),
    makeTxn({ amount: 99900, date: localIso(2026, 8, 30) }), // September
    makeTxn({ amount: 99900, date: localIso(2026, 10, 1, 0) }), // November
    makeTxn({ type: 'income', amount: 77700 }),
    makeTxn({ type: 'transfer', amount: 55500, toAccountId: 'bank' }),
  ];
  const [row] = build({ categories: [food], budgets: [makeBudget()], transactions }).rows;
  assert.equal(row.status.spent, 50000);
  assert.equal(row.status.level, 'ok');
  assert.equal(row.category.id, 'food');
  assert.equal(row.archived, false);
});

test('rows are sorted: over, then warning, then ok; ties by percent, then name', () => {
  const categories = [food, fuel, rent, makeCategory({ id: 'fun', name: 'Fun' })];
  const budgets = [
    makeBudget({ id: '1', categoryId: 'food', monthlyLimit: 10000 }),
    makeBudget({ id: '2', categoryId: 'fuel', monthlyLimit: 10000 }),
    makeBudget({ id: '3', categoryId: 'rent', monthlyLimit: 10000 }),
    makeBudget({ id: '4', categoryId: 'fun', monthlyLimit: 10000 }),
  ];
  const spend = (categoryId, amount) => makeTxn({ categoryId, amount });
  const transactions = [spend('food', 5000), spend('fuel', 9000), spend('rent', 15000), spend('fun', 5000)];
  const ids = build({ categories, budgets, transactions }).rows.map((row) => row.category.id);
  assert.deepEqual(ids, ['rent', 'fuel', 'food', 'fun']); // food and fun tie at 50%: name order
});

test('an archived category with a budget still shows, and is flagged', () => {
  const old = makeCategory({ id: 'old', name: 'Old', archived: true });
  const result = build({ categories: [old], budgets: [makeBudget({ categoryId: 'old' })] });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].archived, true);
  assert.deepEqual(result.unbudgeted, []);
});

test('a budget without a usable category is skipped', () => {
  const budgets = [makeBudget({ id: '1', categoryId: 'gone' }), makeBudget({ id: '2', categoryId: 'salary' })];
  assert.deepEqual(build({ categories: [salary], budgets }).rows, []);
});

test('unbudgeted: active expense categories without a budget, A-Z, with this month spent', () => {
  const archived = makeCategory({ id: 'x', name: 'Aaa', archived: true });
  const result = build({
    categories: [rent, salary, archived, food, fuel],
    budgets: [makeBudget({ categoryId: 'food' })],
    transactions: [makeTxn({ categoryId: 'rent', amount: 12300 }), makeTxn({ categoryId: 'rent', amount: 5, date: localIso(2026, 8, 1) })],
  });
  assert.deepEqual(result.unbudgeted.map((item) => [item.category.id, item.spent]), [['fuel', 0], ['rent', 12300]]);
});

test('getBudgetableCategories ignores income, archived and already budgeted', () => {
  const list = getBudgetableCategories([rent, salary, makeCategory({ id: 'a', archived: true }), food], [makeBudget()]);
  assert.deepEqual(list.map((category) => category.id), ['rent']);
});

test('summary adds limits and spending of all rows', () => {
  const budgets = [
    makeBudget({ id: '1', categoryId: 'food', monthlyLimit: 10000 }),
    makeBudget({ id: '2', categoryId: 'fuel', monthlyLimit: 20000 }),
  ];
  const transactions = [makeTxn({ amount: 12000 }), makeTxn({ categoryId: 'fuel', amount: 3000 })];
  const { rows, summary } = build({ categories: [food, fuel], budgets, transactions });
  assert.equal(summary.limit, 30000);
  assert.equal(summary.spent, 15000);
  assert.equal(summary.percent, 50);
  assert.equal(summary.level, 'ok');
  assert.equal(summarizeRows(rows).remaining, 15000);
  assert.equal(summarizeRows([]), null);
});

test('texts for remaining and spent / limit', () => {
  assert.equal(formatRemaining({ remaining: 120000 }), '₹1,200.00 left');
  assert.equal(formatRemaining({ remaining: 0 }), '₹0.00 left');
  assert.equal(formatRemaining({ remaining: -30000 }), 'Over by ₹300.00');
  assert.equal(formatSpentOfLimit({ spent: 80000, limit: 500000 }), '₹800.00 / ₹5,000.00');
});
