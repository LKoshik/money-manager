import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoanRows, buildPeople, loanTotals, recentPeople, personKey } from '../src/core/loanList.js';
import { makeLoan, makeRepayment, localIso } from './helpers.js';

const loans = [
  makeLoan({ id: 'a', person: 'Ravi', amount: 100000 }),
  makeLoan({ id: 'b', person: 'ravi ', amount: 50000, date: localIso(2026, 9, 11), createdAt: localIso(2026, 9, 11) }),
  makeLoan({ id: 'c', person: 'Meena', amount: 300000, createdAt: localIso(2026, 9, 12) }),
  makeLoan({ id: 'd', person: 'Old', amount: 10000, createdAt: localIso(2026, 9, 13) }),
  makeLoan({ id: 'e', person: 'Bank friend', direction: 'borrowed', amount: 70000, createdAt: localIso(2026, 9, 14) }),
];
const repayments = [makeRepayment({ id: 'p1', loanId: 'a', amount: 40000 }), makeRepayment({ id: 'p2', loanId: 'd', amount: 10000 })];

test('rows: outstanding and settled per loan, repayments newest first', () => {
  const rows = buildLoanRows(loans, [...repayments, makeRepayment({ id: 'p3', loanId: 'a', amount: 1000, date: localIso(2026, 9, 14) })]);
  const a = rows.find((row) => row.loan.id === 'a');
  assert.equal(a.outstanding, 59000);
  assert.deepEqual(a.repayments.map((item) => item.id), ['p3', 'p1']);
  assert.equal(rows.find((row) => row.loan.id === 'd').settled, true);
});

test('people: grouped ignoring case and spaces, outstanding high to low, settled last', () => {
  const people = buildPeople(buildLoanRows(loans, repayments), 'lent');
  assert.deepEqual(people.map((person) => [person.name, person.outstanding]), [['Meena', 300000], ['ravi ', 110000], ['Old', 0]]);
  assert.equal(people[1].openCount, 2);
  assert.equal(people[2].settled, true);
  assert.equal(personKey(' Ravi'), 'ravi');
});

test('people of the other direction are separate', () => {
  assert.deepEqual(buildPeople(buildLoanRows(loans, repayments), 'borrowed').map((person) => person.name), ['Bank friend']);
});

test('totals: what is owed to you and what you owe', () => {
  assert.deepEqual(loanTotals(buildLoanRows(loans, repayments)), { toYou: 410000, youOwe: 70000 });
  assert.deepEqual(loanTotals([]), { toYou: 0, youOwe: 0 });
});

test('recent people: different names, newest first, limited', () => {
  assert.deepEqual(recentPeople(loans), ['Bank friend', 'Old', 'Meena', 'ravi ']);
  assert.deepEqual(recentPeople(loans, 2), ['Bank friend', 'Old']);
});
