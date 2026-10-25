import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDeadline, progressText, totalsText, paceText, contributionTitle } from '../src/core/goalText.js';
import { buildGoalRows } from '../src/core/goalList.js';
import { formatMoney } from '../src/core/money.js';
import { makeGoal, makeContribution, localIso } from './helpers.js';

const now = new Date(2026, 9, 25, 10);
const rowOf = (goal, amount = 0) => buildGoalRows([goal], amount ? [makeContribution({ goalId: goal.id, amount })] : [], now)[0];

test('formatDeadline: no year this year, year otherwise', () => {
  assert.equal(formatDeadline(localIso(2026, 11, 31), now), '31 Dec');
  assert.equal(formatDeadline(localIso(2027, 2, 5), now), '5 Mar 2027');
});

test('progressText and totalsText', () => {
  assert.equal(progressText(rowOf(makeGoal(), 400000)), `${formatMoney(400000)} of ${formatMoney(1000000)} · 40%`);
  assert.equal(totalsText({ saved: 100, target: 1000, percent: 10 }), `${formatMoney(100)} of ${formatMoney(1000)} · 10%`);
});

test('paceText: needs per month, passed, reached, no deadline', () => {
  assert.equal(paceText(rowOf(makeGoal({ deadline: localIso(2026, 11, 31) })), now), `Needs ${formatMoney(500000)} / month to reach by 31 Dec`);
  assert.equal(paceText(rowOf(makeGoal({ deadline: localIso(2026, 9, 1) })), now), 'Deadline passed');
  assert.equal(paceText(rowOf(makeGoal(), 1000000), now), 'Goal reached');
  assert.equal(paceText(rowOf(makeGoal()), now), 'No deadline');
});

test('contributionTitle', () => {
  assert.equal(contributionTitle(makeContribution({ amount: 50000 })), `Added ${formatMoney(50000)}`);
  assert.equal(contributionTitle(makeContribution({ type: 'withdraw', amount: 5000 })), `Withdrew ${formatMoney(5000)}`);
});
