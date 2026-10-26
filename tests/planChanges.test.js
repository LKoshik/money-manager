import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveTarget, scheduledIds, STOP_INPUT } from '../src/core/planChanges.js';
import { planForMonth, monthAllowance } from '../src/core/planModel.js';
import { validatePlan } from '../src/core/validatePlans.js';
import { makePlan } from './helpers.js';

const now = new Date(2026, 10, 15, 10); // 15 Nov 2026
const nov = makePlan({ id: 'n', appliesFrom: '2026-11' });
const dec = makePlan({ id: 'd', appliesFrom: '2026-12', income: 6000000 });

test('the very first plan starts THIS month', () => {
  assert.deepEqual(saveTarget([], now), { appliesFrom: '2026-11', replaceId: null });
});

test('every later change starts NEXT month', () => {
  assert.deepEqual(saveTarget([nov], now), { appliesFrom: '2026-12', replaceId: null });
  assert.deepEqual(saveTarget([nov], new Date(2026, 11, 31, 23, 59)), { appliesFrom: '2027-01', replaceId: null });
});

test('editing again replaces the change already waiting, so only one change waits', () => {
  assert.deepEqual(saveTarget([nov, dec], now), { appliesFrom: '2026-12', replaceId: 'd' });
});

test('the current and past versions are never replaced, however often you save', () => {
  const old = makePlan({ id: 'o', appliesFrom: '2026-08' });
  for (const plans of [[old], [old, nov], [old, nov, dec]]) assert.notEqual(saveTarget(plans, now).replaceId, 'o');
  assert.notEqual(saveTarget([old, nov], now).replaceId, 'n');
});

test('scheduledIds: only changes that have not started (they can be cancelled); never this month or the past', () => {
  const old = makePlan({ id: 'o', appliesFrom: '2026-08' });
  const far = makePlan({ id: 'f', appliesFrom: '2027-02' });
  assert.deepEqual(scheduledIds([old, nov, dec, far], now), ['d', 'f']);
  assert.deepEqual(scheduledIds([old, nov], now), []);
  assert.deepEqual(scheduledIds([], now), []);
});

test('stopping gives a valid version that ends the plan from next month and keeps this month', () => {
  const { appliesFrom } = saveTarget([nov], now);
  const stop = { id: 's', appliesFrom, income: STOP_INPUT.income, buckets: [...STOP_INPUT.buckets], createdAt: now.toISOString() };
  assert.deepEqual(validatePlan(stop), []);
  const plans = [nov, stop];
  assert.equal(monthAllowance(plans, '2026-11'), 1000000);
  assert.equal(monthAllowance(plans, '2026-12'), 0);
  assert.equal(planForMonth(plans, '2026-11').id, 'n');
});

test('cancelling the waiting change gives back the standing plan for every later month', () => {
  const plans = [nov, dec];
  const left = plans.filter((plan) => !scheduledIds(plans, now).includes(plan.id));
  assert.equal(planForMonth(left, '2027-06').id, 'n');
  assert.equal(monthAllowance(left, '2026-11'), monthAllowance(plans, '2026-11'));
});
