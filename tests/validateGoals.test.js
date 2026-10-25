import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateGoal, validateContribution } from '../src/core/validateGoals.js';
import { makeGoal, makeContribution, localIso } from './helpers.js';

test('a normal goal and contribution are valid', () => {
  assert.deepEqual(validateGoal(makeGoal()), []);
  assert.deepEqual(validateGoal(makeGoal({ deadline: localIso(2026, 11, 31), completedAt: localIso(2026, 9, 2), archived: true })), []);
  assert.deepEqual(validateContribution(makeContribution()), []);
  assert.deepEqual(validateContribution(makeContribution({ type: 'withdraw', note: 'oops' })), []);
});

test('goal: each broken field gives exactly one problem', () => {
  const bad = [{ id: '' }, { name: '  ' }, { name: 'x'.repeat(41) }, { icon: '' }, { color: 5 }, { targetAmount: 0 }, { targetAmount: 10.5 }, { targetAmount: -1 },
    { deadline: 'soon' }, { deadline: undefined }, { completedAt: 'x' }, { createdAt: null }, { archived: 'no' }];
  for (const change of bad) assert.equal(validateGoal(makeGoal(change)).length, 1, JSON.stringify(change));
  assert.equal(validateGoal(null).length, 1);
  assert.equal(validateGoal([]).length, 1);
});

test('contribution: each broken field gives exactly one problem', () => {
  const bad = [{ id: '' }, { goalId: '' }, { type: 'give' }, { amount: 0 }, { amount: -5 }, { amount: 1.5 }, { date: 'x' }, { note: null }];
  for (const change of bad) assert.equal(validateContribution(makeContribution(change)).length, 1, JSON.stringify(change));
  assert.equal(validateContribution('x').length, 1);
});
