import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saved, remaining, percent, barPercent, status, monthsLeft, neededPerMonth, completionFor } from '../src/core/goalModel.js';
import { makeGoal, makeContribution, localIso } from './helpers.js';

const now = new Date(2026, 9, 25, 10); // 25 Oct 2026, local

test('saved = all add minus all withdraw', () => {
  const list = [makeContribution({ amount: 50000 }), makeContribution({ id: 'c2', amount: 20000 }), makeContribution({ id: 'c3', type: 'withdraw', amount: 30000 })];
  assert.equal(saved(list), 40000);
  assert.equal(saved([]), 0);
});

test('remaining never goes below 0', () => {
  assert.equal(remaining(makeGoal(), 250000), 750000);
  assert.equal(remaining(makeGoal(), 1200000), 0);
});

test('percent rounds DOWN, can pass 100; barPercent stops at 100', () => {
  const goal = makeGoal();
  assert.equal(percent(goal, 333333), 33);
  assert.equal(percent(goal, 999999), 99);
  assert.equal(percent(goal, 1000000), 100);
  assert.equal(percent(goal, 1500000), 150);
  assert.equal(barPercent(goal, 1500000), 100);
  assert.equal(barPercent(goal, 0), 0);
});

test('status: active, reached, overdue (the deadline day itself is not overdue)', () => {
  assert.equal(status(makeGoal(), 0, now), 'active');
  assert.equal(status(makeGoal(), 1000000, now), 'reached');
  assert.equal(status(makeGoal({ deadline: localIso(2026, 9, 24) }), 0, now), 'overdue');
  assert.equal(status(makeGoal({ deadline: localIso(2026, 9, 25) }), 0, now), 'active');
  assert.equal(status(makeGoal({ deadline: localIso(2026, 9, 1) }), 1000000, now), 'reached'); // reached beats overdue
});

test('monthsLeft counts local calendar months and is never negative', () => {
  assert.equal(monthsLeft(makeGoal({ deadline: localIso(2026, 11, 31) }), now), 2);
  assert.equal(monthsLeft(makeGoal({ deadline: localIso(2027, 9, 25) }), now), 12);
  assert.equal(monthsLeft(makeGoal({ deadline: localIso(2026, 9, 31) }), now), 0);
  assert.equal(monthsLeft(makeGoal({ deadline: localIso(2026, 0, 1) }), now), 0);
  assert.equal(monthsLeft(makeGoal(), now), 0);
});

test('neededPerMonth rounds UP in whole paise', () => {
  const dec = makeGoal({ deadline: localIso(2026, 11, 31) });
  assert.equal(neededPerMonth(dec, 0, now), 500000);
  assert.equal(neededPerMonth({ ...dec, targetAmount: 1000001 }, 0, now), 500001);
  assert.equal(neededPerMonth(dec, 400000, now), 300000);
});

test('neededPerMonth: this month divides by 1; no deadline, reached, overdue give null', () => {
  assert.equal(neededPerMonth(makeGoal({ deadline: localIso(2026, 9, 31) }), 0, now), 1000000);
  assert.equal(neededPerMonth(makeGoal(), 0, now), null);
  assert.equal(neededPerMonth(makeGoal({ deadline: localIso(2026, 11, 31) }), 1000000, now), null);
  assert.equal(neededPerMonth(makeGoal({ deadline: localIso(2026, 8, 1) }), 0, now), null);
});

test('completionFor: set once, keep the old stamp, clear below the target', () => {
  const goal = makeGoal();
  assert.equal(completionFor(goal, 1000000, now), now.toISOString());
  assert.equal(completionFor({ ...goal, completedAt: 'old' }, 1100000, now), 'old');
  assert.equal(completionFor({ ...goal, completedAt: 'old' }, 999999, now), null);
});
