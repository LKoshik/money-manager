import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plannerStart, assignedToGoals, pastAllowances, availableToAssign, availableAmount, checkAssign } from '../src/core/stackModel.js';
import { makePlan, makeContribution, localIso } from './helpers.js';

// Plan from Oct 2026: allowance 10,000.00 per month (income 50,000 - buckets 40,000). Created 1 Oct 2026.
const oct = makePlan();
const dec = makePlan({ id: 'pl2', appliesFrom: '2026-12', income: 6000000, createdAt: localIso(2026, 10, 20) }); // allowance 20,000.00
const now = new Date(2026, 11, 15, 10); // 15 Dec 2026 (Oct + Nov are past)
const add = (amount, day, extra = {}) => makeContribution({ id: `c${day}${amount}${extra.goalId ?? ''}`, amount, date: localIso(2026, 9, day), ...extra });

test('no plan: the planner is not in use (null, no limit)', () => {
  assert.equal(availableToAssign({ plans: [], contributions: [] }, now), null);
  assert.equal(availableAmount({ plans: [], contributions: [] }, now), null);
  assert.deepEqual(checkAssign(null, 999999999), []);
});

test('plannerStart is the oldest version', () => {
  assert.equal(plannerStart([dec, oct]), oct.createdAt);
  assert.equal(plannerStart([]), null);
});

test('past months stack up; the current month is NOT in the past', () => {
  assert.equal(pastAllowances([oct], new Date(2026, 9, 20)), 0); // first month: nothing is past yet
  assert.equal(pastAllowances([oct], new Date(2026, 10, 1)), 1000000);
  assert.equal(pastAllowances([oct], now), 2000000);
  assert.equal(pastAllowances([oct, dec], new Date(2027, 0, 5)), 1000000 * 2 + 2000000); // Oct, Nov at 10k, Dec at 20k
});

test('available = past allowances + this month - assigned (calculated, nothing stored)', () => {
  const state = { plans: [oct], contributions: [add(300000, 5)] };
  const result = availableToAssign(state, now);
  assert.equal(result.allowance, 1000000);
  assert.equal(result.pastAllowances, 2000000);
  assert.equal(result.assigned, 300000);
  assert.equal(result.stack, 1700000);
  assert.equal(result.available, 2700000);
  assert.equal(result.carriedOver, 1700000);
  assert.equal(result.thisMonthLeft, 1000000);
  assert.equal(result.overBy, 0);
});

test('a plan edit for later never changes the stack of earlier months', () => {
  const before = availableToAssign({ plans: [oct], contributions: [] }, new Date(2026, 10, 15));
  const after = availableToAssign({ plans: [oct, dec], contributions: [] }, new Date(2026, 10, 15));
  assert.deepEqual(after, before);
});

test('assigning uses the carried-over stack first, then this month', () => {
  const result = availableToAssign({ plans: [oct], contributions: [add(2500000, 5)] }, now);
  assert.equal(result.stack, -500000);
  assert.equal(result.carriedOver, 0);
  assert.equal(result.thisMonthLeft, 500000);
  assert.equal(result.available, 500000);
});

test('a withdrawal gives money back to the stack', () => {
  const contributions = [add(500000, 5), makeContribution({ id: 'w', type: 'withdraw', amount: 200000, date: localIso(2026, 9, 9) })];
  assert.equal(assignedToGoals(contributions, oct.createdAt), 300000);
});

test('money added to goals BEFORE the planner existed is not counted', () => {
  const old = makeContribution({ id: 'old', amount: 900000, date: localIso(2026, 8, 20) });
  assert.equal(assignedToGoals([old, add(100000, 5)], oct.createdAt), 100000);
});

test('withdrawing old money never inflates the stack (each goal counts 0 at least)', () => {
  const old = makeContribution({ id: 'old', amount: 900000, date: localIso(2026, 8, 20) });
  const take = makeContribution({ id: 'w', type: 'withdraw', amount: 400000, date: localIso(2026, 9, 9) });
  assert.equal(assignedToGoals([old, take], oct.createdAt), 0);
  // 100 added after the start, then 400 withdrawn: the 100 comes back, the other 300 was old money.
  assert.equal(assignedToGoals([old, add(100000, 5), take], oct.createdAt), 0);
});

test('goals are counted one by one', () => {
  const other = add(200000, 6, { goalId: 'g2' });
  const take = makeContribution({ id: 'w', goalId: 'g2', type: 'withdraw', amount: 50000, date: localIso(2026, 9, 12) });
  assert.equal(assignedToGoals([add(100000, 5), other, take], oct.createdAt), 250000);
});

test('assigned money from an earlier month still counts later (no month-end job needed)', () => {
  const state = { plans: [oct], contributions: [add(400000, 3)] };
  assert.equal(availableAmount(state, new Date(2026, 9, 20)), 1000000 - 400000);
  assert.equal(availableAmount(state, new Date(2026, 10, 20)), 2000000 - 400000);
});

test('buckets bigger than income give nothing (no debt), and a stopped plan stops stacking', () => {
  const big = makePlan({ income: 3000000 });
  assert.equal(availableAmount({ plans: [big], contributions: [] }, now), 0);
  const stop = makePlan({ id: 'stop', appliesFrom: '2026-11', income: 0, buckets: [], createdAt: localIso(2026, 9, 25) });
  assert.equal(availableAmount({ plans: [oct, stop], contributions: [] }, now), 1000000); // only October stacked
});

test('over-assigned shows how much, available stays negative', () => {
  const result = availableToAssign({ plans: [oct], contributions: [add(4000000, 5)] }, now);
  assert.equal(result.available, -1000000);
  assert.equal(result.overBy, 1000000);
  assert.equal(result.carriedOver, 0);
  assert.equal(result.thisMonthLeft, 0);
});

test('the wishes part of extra income adds to the stack (the other parts do not)', () => {
  const gift = { id: 'e1', name: 'Gift', amount: 800000, wishes: 500000, buckets: [{ id: 'b1', name: 'Savings', amount: 300000 }] };
  const result = availableToAssign({ plans: [oct], contributions: [], extraIncomes: [gift] }, now);
  assert.equal(result.extraWishes, 500000);
  assert.equal(result.available, 3500000);
  assert.equal(availableToAssign({ plans: [oct], contributions: [] }, now).available, 3000000);
});

test('extra income counts at once, in any month, and keeps stacking after it is assigned', () => {
  const gift = { id: 'e1', wishes: 700000 };
  const state = { plans: [oct], contributions: [add(200000, 5)], extraIncomes: [gift] };
  assert.equal(availableAmount(state, new Date(2026, 9, 20)), 1000000 + 700000 - 200000);
  assert.equal(availableAmount(state, now), 2000000 + 1000000 + 700000 - 200000);
});

test('checkAssign: up to the available amount is fine, one paisa more is refused', () => {
  assert.deepEqual(checkAssign(100000, 100000), []);
  assert.equal(checkAssign(100000, 100001).length, 1);
  assert.match(checkAssign(0, 1)[0], /Only ₹0\.00 is available/);
  assert.equal(checkAssign(-5, 1).length, 1);
});
