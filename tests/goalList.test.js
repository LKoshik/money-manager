import { test } from 'node:test';
import assert from 'node:assert/strict';
import { savedByGoal, buildGoalRows, sortGoalRows, goalTotals } from '../src/core/goalList.js';
import { makeGoal, makeContribution, localIso } from './helpers.js';

const now = new Date(2026, 9, 25, 10);

test('savedByGoal groups contributions per goal', () => {
  const map = savedByGoal([makeContribution({ amount: 500 }), makeContribution({ id: 'c2', goalId: 'g2', amount: 700 }), makeContribution({ id: 'c3', type: 'withdraw', amount: 200 })]);
  assert.equal(map.get('g1'), 300);
  assert.equal(map.get('g2'), 700);
});

test('buildGoalRows: a goal without contributions has 0 saved', () => {
  const [row] = buildGoalRows([makeGoal()], [], now);
  assert.deepEqual([row.saved, row.remaining, row.percent, row.status], [0, 1000000, 0, 'active']);
});

test('sort: nearest deadline first, no deadline later, then higher percent; reached then archived last', () => {
  const goals = [
    makeGoal({ id: 'none', name: 'No deadline' }),
    makeGoal({ id: 'late', deadline: localIso(2027, 5, 1) }),
    makeGoal({ id: 'soon', deadline: localIso(2026, 11, 1) }),
    makeGoal({ id: 'done', targetAmount: 100 }),
    makeGoal({ id: 'old', archived: true, deadline: localIso(2026, 10, 1) }),
    makeGoal({ id: 'soon2', deadline: localIso(2026, 11, 1) }),
  ];
  const contributions = [
    makeContribution({ id: 'a', goalId: 'done', amount: 100 }),
    makeContribution({ id: 'b', goalId: 'soon2', amount: 500000 }),
  ];
  const order = sortGoalRows(buildGoalRows(goals, contributions, now)).map((row) => row.goal.id);
  assert.deepEqual(order, ['soon2', 'soon', 'late', 'none', 'done', 'old']);
});

test('sort does not change the original list', () => {
  const rows = buildGoalRows([makeGoal({ id: 'b', deadline: localIso(2027, 1, 1) }), makeGoal({ id: 'a', deadline: localIso(2026, 11, 1) })], [], now);
  sortGoalRows(rows);
  assert.equal(rows[0].goal.id, 'b');
});

test('goalTotals adds targets and saved; empty list gives zeros', () => {
  const rows = buildGoalRows([makeGoal(), makeGoal({ id: 'g2', targetAmount: 3000000 })], [makeContribution({ amount: 1000000 })], now);
  const totals = goalTotals(rows);
  assert.deepEqual([totals.count, totals.reachedCount, totals.target, totals.saved, totals.percent, totals.status], [2, 1, 4000000, 1000000, 25, 'active']);
  assert.deepEqual([goalTotals([]).count, goalTotals([]).percent, goalTotals([]).status], [0, 0, 'active']);
});

test('goalTotals: all reached gives status reached and the bar stops at 100', () => {
  const rows = buildGoalRows([makeGoal()], [makeContribution({ amount: 2000000 })], now);
  const totals = goalTotals(rows);
  assert.equal(totals.status, 'reached');
  assert.equal(totals.percent, 200);
  assert.equal(totals.barPercent, 100);
});
