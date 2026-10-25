import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRecurring } from '../src/core/validateRecurring.js';
import { validateTransaction } from '../src/core/validate.js';
import { SETTING_DEFAULTS, validateSetting } from '../src/core/validateSettings.js';
import * as validateFile from '../src/core/validate.js';
import { makeRule, makeTxn, localIso } from './helpers.js';

const has = (errors, word) => errors.some((message) => message.includes(word));

test('a correct rule has no problems (also a transfer, and an end date)', () => {
  assert.deepEqual(validateRecurring(makeRule()), []);
  assert.deepEqual(validateRecurring(makeRule({ type: 'transfer', toAccountId: 'bank', categoryId: null })), []);
  assert.deepEqual(validateRecurring(makeRule({ endDate: localIso(2026, 9, 5) })), []);
});

test('wrong fields are reported', () => {
  assert.ok(has(validateRecurring(null), 'object'));
  assert.ok(has(validateRecurring(makeRule({ frequency: 'daily' })), 'frequency'));
  assert.ok(has(validateRecurring(makeRule({ amount: 0 })), 'amount'));
  assert.ok(has(validateRecurring(makeRule({ amount: 10.5 })), 'amount'));
  assert.ok(has(validateRecurring(makeRule({ startDate: 'soon' })), 'startDate'));
  assert.ok(has(validateRecurring(makeRule({ active: 'yes' })), 'active'));
  assert.ok(has(validateRecurring(makeRule({ generatedCount: -1 })), 'generatedCount'));
  assert.ok(has(validateRecurring(makeRule({ generatedCount: 1.5 })), 'generatedCount'));
  assert.ok(has(validateRecurring(makeRule({ type: 'loan' })), 'type'));
});

test('end date before the start date is refused', () => {
  assert.ok(has(validateRecurring(makeRule({ endDate: localIso(2026, 9, 4) })), 'endDate'));
  assert.ok(has(validateRecurring(makeRule({ endDate: 'nope' })), 'endDate'));
});

test('type rules are the same as for transactions', () => {
  assert.ok(has(validateRecurring(makeRule({ categoryId: null })), 'categoryId'));
  assert.ok(has(validateRecurring(makeRule({ type: 'transfer', toAccountId: null, categoryId: null })), 'toAccountId'));
  assert.ok(has(validateRecurring(makeRule({ type: 'transfer', toAccountId: 'cash', categoryId: null })), 'different account'));
});

test('transaction recurringId: missing and null are fine, other values must be text', () => {
  assert.deepEqual(validateTransaction(makeTxn()), []); // old transactions have none
  assert.deepEqual(validateTransaction(makeTxn({ recurringId: null })), []);
  assert.deepEqual(validateTransaction(makeTxn({ recurringId: 'r1' })), []);
  assert.ok(has(validateTransaction(makeTxn({ recurringId: 5 })), 'recurringId'));
});

test('recurringEnabled setting: default OFF, boolean only, old import path still works', () => {
  assert.equal(SETTING_DEFAULTS.recurringEnabled, false);
  assert.deepEqual(validateSetting('recurringEnabled', true), []);
  assert.ok(has(validateSetting('recurringEnabled', 'on'), 'recurringEnabled'));
  assert.equal(validateFile.SETTING_DEFAULTS, SETTING_DEFAULTS); // validate.js re-exports
  assert.equal(validateFile.validateSetting, validateSetting);
});
