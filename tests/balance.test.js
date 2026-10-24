import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTransactionEffects,
  calculateBalances,
  calculateBalance,
  calculateTotalBalance,
} from '../src/core/balance.js';
import { makeAccount, makeTxn } from './helpers.js';

const cash = makeAccount({ id: 'cash', openingBalance: 100000 });
const bank = makeAccount({ id: 'bank', type: 'bank', openingBalance: 500000 });

test('getTransactionEffects: income, expense, transfer', () => {
  assert.deepEqual(getTransactionEffects(makeTxn({ type: 'income', amount: 700 })), [['cash', 700]]);
  assert.deepEqual(getTransactionEffects(makeTxn({ type: 'expense', amount: 700 })), [['cash', -700]]);
  const transfer = makeTxn({ type: 'transfer', amount: 700, toAccountId: 'bank' });
  assert.deepEqual(getTransactionEffects(transfer), [['cash', -700], ['bank', 700]]);
});

test('getTransactionEffects: unknown type changes nothing', () => {
  assert.deepEqual(getTransactionEffects(makeTxn({ type: 'mystery' })), []);
});

test('calculateBalance: no transactions gives the opening balance', () => {
  assert.equal(calculateBalance(cash, []), 100000);
});

test('calculateBalance: opening + income - expense', () => {
  const txns = [
    makeTxn({ type: 'income', amount: 50000 }),
    makeTxn({ type: 'expense', amount: 12000 }),
    makeTxn({ type: 'expense', amount: 3000 }),
  ];
  assert.equal(calculateBalance(cash, txns), 100000 + 50000 - 12000 - 3000);
});

test('calculateBalances: a transfer moves money and keeps the total the same', () => {
  const txns = [makeTxn({ type: 'transfer', amount: 20000, accountId: 'bank', toAccountId: 'cash' })];
  const balances = calculateBalances([cash, bank], txns);
  assert.equal(balances.cash, 120000);
  assert.equal(balances.bank, 480000);
  assert.equal(calculateTotalBalance([cash, bank], balances), 600000);
});

test('calculateBalances: ignores accounts it was not given', () => {
  const txns = [makeTxn({ type: 'expense', amount: 500, accountId: 'ghost' })];
  assert.deepEqual(calculateBalances([cash], txns), { cash: 100000 });
});

test('calculateBalances: a credit card can be negative', () => {
  const card = makeAccount({ id: 'card', type: 'credit', openingBalance: 0 });
  const txns = [makeTxn({ type: 'expense', amount: 250000, accountId: 'card' })];
  assert.equal(calculateBalances([card], txns).card, -250000);
});

test('calculateTotalBalance: archived accounts are not counted', () => {
  const old = makeAccount({ id: 'old', openingBalance: 999, archived: true });
  const balances = calculateBalances([cash, old], []);
  assert.equal(calculateTotalBalance([cash, old], balances), 100000);
});

test('calculateTotalBalance: no accounts gives 0', () => {
  assert.equal(calculateTotalBalance([], {}), 0);
});
