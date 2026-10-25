import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLoanEffects, getRepaymentEffects, getLoanBalanceEffects } from '../src/core/loanEffects.js';
import { calculateBalances, calculateBalancesWithLoans, calculateTotalBalance } from '../src/core/balance.js';
import { makeLoan, makeRepayment, makeAccount, makeTxn } from './helpers.js';

test('lent: the loan takes money out, a repayment brings it back', () => {
  assert.deepEqual(getLoanEffects(makeLoan()), [['cash', -100000]]);
  assert.deepEqual(getRepaymentEffects(makeRepayment(), makeLoan()), [['cash', 30000]]);
});

test('borrowed: the loan brings money in, a repayment takes it out', () => {
  const loan = makeLoan({ direction: 'borrowed' });
  assert.deepEqual(getLoanEffects(loan), [['cash', 100000]]);
  assert.deepEqual(getRepaymentEffects(makeRepayment(), loan), [['cash', -30000]]);
});

test('a repayment of a missing loan is ignored', () => {
  assert.deepEqual(getLoanBalanceEffects([makeLoan()], [makeRepayment({ loanId: 'zzz' })]), [['cash', -100000]]);
});

test('calculateBalances keeps its old behavior: it knows nothing about loans', () => {
  const accounts = [makeAccount({ openingBalance: 500000 })];
  assert.deepEqual(calculateBalances(accounts, []), { cash: 500000 });
  assert.deepEqual(calculateBalancesWithLoans(accounts, []), { cash: 500000 });
});

test('calculateBalancesWithLoans: lend, partial repayment, borrow, other accounts', () => {
  const accounts = [makeAccount({ openingBalance: 500000 }), makeAccount({ id: 'bank', openingBalance: 200000 })];
  const loans = [makeLoan(), makeLoan({ id: 'l2', direction: 'borrowed', amount: 50000, accountId: 'bank' })];
  const repayments = [makeRepayment(), makeRepayment({ id: 'p2', loanId: 'l2', amount: 10000, accountId: 'bank' })];
  const balances = calculateBalancesWithLoans(accounts, [makeTxn({ type: 'expense', amount: 20000 })], loans, repayments);
  assert.equal(balances.cash, 500000 - 20000 - 100000 + 30000);
  assert.equal(balances.bank, 200000 + 50000 - 10000);
  assert.equal(calculateTotalBalance(accounts, balances), balances.cash + balances.bank);
});

test('loans on an account we were not asked about are skipped; archived accounts stay out of the total', () => {
  const accounts = [makeAccount({ openingBalance: 100000 }), makeAccount({ id: 'old', archived: true, openingBalance: 0 })];
  const balances = calculateBalancesWithLoans(accounts, [], [makeLoan({ accountId: 'old' }), makeLoan({ id: 'x', accountId: 'nope' })]);
  assert.deepEqual(balances, { cash: 100000, old: -100000 });
  assert.equal(calculateTotalBalance(accounts, balances), 100000);
});
