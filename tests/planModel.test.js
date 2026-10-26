import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentMonthKey, nextMonthKey, planForMonth, bucketsTotal, summarizePlan, monthAllowance, isStopped, planView } from '../src/core/planModel.js';
import { makePlan } from './helpers.js';

const oct = makePlan();
const dec = makePlan({ id: 'pl2', appliesFrom: '2026-12', income: 6000000, buckets: [{ id: 'b1', name: 'Rent / needs', amount: 3500000 }] });
const now = new Date(2026, 10, 15, 10); // 15 Nov 2026

test('month keys follow the calendar month, also across a year end', () => {
  assert.equal(currentMonthKey(now), '2026-11');
  assert.equal(nextMonthKey(now), '2026-12');
  assert.equal(nextMonthKey(new Date(2026, 11, 31, 23)), '2027-01');
  assert.equal(currentMonthKey(new Date(2026, 0, 1, 0, 30)), '2026-01');
});

test('planForMonth: the newest version that has started; none before the first one', () => {
  assert.equal(planForMonth([oct, dec], '2026-09'), null);
  assert.equal(planForMonth([oct, dec], '2026-10').id, 'pl1');
  assert.equal(planForMonth([oct, dec], '2026-11').id, 'pl1');
  assert.equal(planForMonth([dec, oct], '2026-12').id, 'pl2');
  assert.equal(planForMonth([dec, oct], '2027-05').id, 'pl2');
  assert.equal(planForMonth([], '2026-10'), null);
});

test('the wishes allowance is income minus the buckets (calculated, never stored)', () => {
  assert.equal(bucketsTotal(oct), 4000000);
  assert.deepEqual(summarizePlan(oct), { income: 5000000, bucketsTotal: 4000000, allowance: 1000000, overBy: 0 });
  assert.equal(Object.hasOwn(oct, 'allowance'), false);
});

test('buckets bigger than the income: negative allowance, warning amount, and 0 for the stack', () => {
  const big = makePlan({ income: 3000000 });
  assert.deepEqual(summarizePlan(big), { income: 3000000, bucketsTotal: 4000000, allowance: -1000000, overBy: 1000000 });
  assert.equal(monthAllowance([big], '2026-10'), 0);
  assert.equal(summarizePlan(makePlan({ income: 4000000 })).overBy, 0);
});

test('monthAllowance: 0 before the plan existed, then the plan of that month', () => {
  assert.equal(monthAllowance([oct, dec], '2026-09'), 0);
  assert.equal(monthAllowance([oct, dec], '2026-11'), 1000000);
  assert.equal(monthAllowance([oct, dec], '2026-12'), 2500000);
});

test('a new version never changes the allowance of the months before it', () => {
  const months = ['2026-10', '2026-11', '2026-12', '2027-01'];
  const before = months.map((month) => monthAllowance([oct], month));
  const after = months.map((month) => monthAllowance([oct, dec], month));
  assert.deepEqual(after.slice(0, 2), before.slice(0, 2));
  assert.notEqual(after[2], before[2]);
});

test('isStopped: no income and no buckets', () => {
  assert.equal(isStopped(makePlan({ income: 0, buckets: [] })), true);
  assert.equal(isStopped(oct), false);
  assert.equal(monthAllowance([oct, makePlan({ id: 's', appliesFrom: '2026-12', income: 0, buckets: [] })], '2026-12'), 0);
});

test('planView: nothing saved yet', () => {
  assert.deepEqual(planView([], now), { month: '2026-11', nextMonth: '2026-12', hasAny: false, current: null, upcoming: null });
});

test('planView: this month plan plus the change that is waiting', () => {
  const view = planView([dec, oct], now);
  assert.equal(view.current.plan.id, 'pl1');
  assert.equal(view.current.summary.allowance, 1000000);
  assert.equal(view.upcoming.plan.id, 'pl2');
  assert.equal(view.upcoming.summary.allowance, 2500000);
  assert.equal(view.hasAny, true);
});

test('planView: the earliest waiting change is the upcoming one; a stopped plan shows no current', () => {
  const later = makePlan({ id: 'pl3', appliesFrom: '2027-03' });
  assert.equal(planView([oct, later, dec], now).upcoming.plan.id, 'pl2');
  const stopped = makePlan({ id: 's', appliesFrom: '2026-11', income: 0, buckets: [] });
  const view = planView([oct, stopped], now);
  assert.equal(view.current, null);
  assert.equal(view.hasAny, true);
});

test('planView: a plan that starts next month only has no current yet', () => {
  const view = planView([dec], now);
  assert.equal(view.current, null);
  assert.equal(view.upcoming.plan.id, 'pl2');
});
