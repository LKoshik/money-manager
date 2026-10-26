import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePlan, checkPlanVersions, MAX_BUCKETS } from '../src/core/validatePlans.js';
import { makePlan } from './helpers.js';

const has = (errors, word) => errors.some((message) => message.includes(word));

test('a correct plan has no problems, also with no buckets or no income (a stopped plan)', () => {
  assert.deepEqual(validatePlan(makePlan()), []);
  assert.deepEqual(validatePlan(makePlan({ income: 0, buckets: [] })), []);
});

test('buckets bigger than the income are NOT an error (it is a warning on screen)', () => {
  assert.deepEqual(validatePlan(makePlan({ income: 100 })), []);
});

test('bad fields are reported', () => {
  assert.ok(has(validatePlan(null), 'object'));
  assert.ok(has(validatePlan(makePlan({ id: '' })), 'id'));
  assert.ok(has(validatePlan(makePlan({ appliesFrom: '2026-13' })), 'appliesFrom'));
  assert.ok(has(validatePlan(makePlan({ appliesFrom: '2026-1' })), 'appliesFrom'));
  assert.ok(has(validatePlan(makePlan({ income: -1 })), 'income'));
  assert.ok(has(validatePlan(makePlan({ income: 10.5 })), 'income'));
  assert.ok(has(validatePlan(makePlan({ createdAt: 'x' })), 'createdAt'));
  assert.ok(has(validatePlan(makePlan({ buckets: 'x' })), 'buckets must be a list'));
});

test('bad buckets are reported', () => {
  const bucket = { id: 'x', name: 'Rent', amount: 100 };
  assert.ok(has(validatePlan(makePlan({ buckets: [{ ...bucket, name: ' ' }] })), 'bucket name'));
  assert.ok(has(validatePlan(makePlan({ buckets: [{ ...bucket, name: 'x'.repeat(41) }] })), 'bucket name'));
  assert.ok(has(validatePlan(makePlan({ buckets: [{ ...bucket, amount: 0 }] })), 'bucket amount'));
  assert.ok(has(validatePlan(makePlan({ buckets: [{ ...bucket, id: '' }] })), 'bucket id'));
  assert.ok(has(validatePlan(makePlan({ buckets: [bucket, bucket] })), 'used twice'));
  assert.ok(has(validatePlan(makePlan({ buckets: [null] })), 'bucket must be an object'));
  const many = Array.from({ length: MAX_BUCKETS + 1 }, (_, index) => ({ id: `b${index}`, name: 'x', amount: 1 }));
  assert.ok(has(validatePlan(makePlan({ buckets: many })), 'at most'));
});

test('checkPlanVersions: two versions for one month are refused', () => {
  const errors = [];
  checkPlanVersions([makePlan(), makePlan({ id: 'pl2', appliesFrom: '2026-11' })], errors);
  assert.deepEqual(errors, []);
  checkPlanVersions([makePlan(), makePlan({ id: 'pl2' })], errors);
  assert.deepEqual(errors, ['plans[1]: second version for 2026-10']);
});
