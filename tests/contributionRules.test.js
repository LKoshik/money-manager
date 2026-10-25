import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkNewContribution, checkRemoval } from '../src/core/contributionRules.js';
import { makeContribution } from './helpers.js';

const existing = [makeContribution({ id: 'a', amount: 50000 }), makeContribution({ id: 'w', type: 'withdraw', amount: 20000 })];

test('add: any positive amount is fine', () => {
  assert.deepEqual(checkNewContribution([], { type: 'add', amount: 100 }), []);
});

test('withdraw: up to the saved amount is fine, one paisa more is refused', () => {
  assert.deepEqual(checkNewContribution(existing, { type: 'withdraw', amount: 30000 }), []);
  assert.equal(checkNewContribution(existing, { type: 'withdraw', amount: 30001 }).length, 1);
  assert.equal(checkNewContribution([], { type: 'withdraw', amount: 1 }).length, 1);
});

test('bad type or amount is refused', () => {
  assert.equal(checkNewContribution([], { type: 'steal', amount: 100 }).length, 1);
  for (const amount of [0, -5, 1.5, NaN, null, '10']) assert.equal(checkNewContribution([], { type: 'add', amount }).length, 1);
});

test('removal: deleting the add under a withdrawal is refused; others are fine', () => {
  assert.equal(checkRemoval(existing, 'a').length, 1); // would leave -20000
  assert.equal(checkRemoval(existing, 'w').length, 0);
  assert.equal(checkRemoval([...existing, makeContribution({ id: 'b', amount: 30000 })], 'a').length, 0); // 30000 - 20000 >= 0
  assert.equal(checkRemoval(existing, 'missing').length, 1);
});
