import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardModel, pickRecent, spentPercent, RECENT_COUNT } from '../src/core/dashboardModel.js';
import { localIso, makeAccount, makeTxn } from './helpers.js';

const now = new Date(2026, 9, 24, 10); // 24 Oct 2026, local time

test('empty data gives zeros and empty lists', () => {
  const model = buildDashboardModel({ accounts: [], transactions: [] }, now);
  assert.equal(model.total, 0);
  assert.deepEqual(model.month, { income: 0, expense: 0, net: 0, spentPercent: null });
  assert.deepEqual(model.accounts, []);
  assert.deepEqual(model.recent, []);
});

test('total ignores archived accounts and a credit card lowers it', () => {
  const accounts = [
    makeAccount({ id: 'cash', openingBalance: 100000 }),
    makeAccount({ id: 'card', type: 'credit', openingBalance: -50000 }),
    makeAccount({ id: 'old', archived: true, openingBalance: 999999 }),
  ];
  assert.equal(buildDashboardModel({ accounts, transactions: [] }, now).total, 50000);
});

test('accounts lists active accounts only, oldest first, with balances', () => {
  const accounts = [
    makeAccount({ id: 'bank', name: 'Bank', createdAt: localIso(2026, 2, 1), openingBalance: 5000 }),
    makeAccount({ id: 'cash', createdAt: localIso(2026, 0, 1) }),
    makeAccount({ id: 'old', archived: true }),
  ];
  const txns = [makeTxn({ type: 'income', amount: 700, accountId: 'bank' })];
  const model = buildDashboardModel({ accounts, transactions: txns }, now);
  assert.deepEqual(model.accounts.map((row) => [row.account.id, row.balance]), [['cash', 0], ['bank', 5700]]);
});

test('month totals use this month only and never count transfers', () => {
  const txns = [
    makeTxn({ type: 'income', amount: 100000 }),
    makeTxn({ type: 'expense', amount: 25000 }),
    makeTxn({ type: 'transfer', amount: 77777, toAccountId: 'bank', categoryId: null }),
    makeTxn({ type: 'expense', amount: 99999, date: localIso(2026, 8, 20) }),
  ];
  const { month } = buildDashboardModel({ accounts: [makeAccount()], transactions: txns }, now);
  assert.deepEqual(month, { income: 100000, expense: 25000, net: 75000, spentPercent: 25 });
});

test('month borders: first moment counts, last moment of last month and first of next do not', () => {
  const at = (y, m, d, h, min) => new Date(y, m, d, h, min).toISOString();
  const txns = [
    makeTxn({ amount: 100, date: at(2026, 9, 1, 0, 0) }),
    makeTxn({ amount: 200, date: at(2026, 8, 30, 23, 59) }),
    makeTxn({ amount: 400, date: at(2026, 10, 1, 0, 0) }),
  ];
  assert.equal(buildDashboardModel({ accounts: [], transactions: txns }, now).month.expense, 100);
});

test('pickRecent: newest first, ties go to the later created, limited', () => {
  const txns = Array.from({ length: 9 }, (_, i) => makeTxn({ id: `t${i}`, date: localIso(2026, 9, 10 + i) }));
  const recent = pickRecent(txns);
  assert.equal(recent.length, RECENT_COUNT);
  assert.deepEqual(recent.map((t) => t.id), ['t8', 't7', 't6', 't5', 't4', 't3']);

  const sameDay = [
    makeTxn({ id: 'early', createdAt: localIso(2026, 9, 15, 8) }),
    makeTxn({ id: 'late', createdAt: localIso(2026, 9, 15, 20) }),
  ];
  assert.deepEqual(pickRecent(sameDay).map((t) => t.id), ['late', 'early']);
});

test('pickRecent includes transfers and does not change the input', () => {
  const txns = [makeTxn({ id: 'a' }), makeTxn({ id: 'b', type: 'transfer', toAccountId: 'bank', categoryId: null, date: localIso(2026, 9, 16) })];
  const copy = [...txns];
  assert.equal(pickRecent(txns)[0].id, 'b');
  assert.deepEqual(txns, copy);
});

test('spentPercent: rounds, can pass 100, null without income', () => {
  assert.equal(spentPercent({ income: 300, expense: 100 }), 33);
  assert.equal(spentPercent({ income: 100, expense: 150 }), 150);
  assert.equal(spentPercent({ income: 0, expense: 500 }), null);
});
