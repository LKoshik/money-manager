import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAccount,
  validateCategory,
  validateTransaction,
  validateBudget,
  validateSetting,
  normalizeText,
  assertValid,
  SETTING_DEFAULTS,
} from '../src/core/validate.js';
import { makeAccount, makeCategory, makeTxn, makeBudget } from './helpers.js';

const has = (errors, word) => errors.some((message) => message.includes(word));

test('valid items give no problems', () => {
  assert.deepEqual(validateAccount(makeAccount()), []);
  assert.deepEqual(validateCategory(makeCategory()), []);
  assert.deepEqual(validateTransaction(makeTxn()), []);
  assert.deepEqual(validateBudget(makeBudget()), []);
});

test('anything that is not an object is refused', () => {
  for (const bad of [null, undefined, 'text', 5, []]) {
    assert.equal(validateAccount(bad).length, 1);
    assert.equal(validateTransaction(bad).length, 1);
  }
});

test('account: name, type and opening balance are checked', () => {
  assert.ok(has(validateAccount(makeAccount({ name: '   ' })), 'name'));
  assert.ok(has(validateAccount(makeAccount({ name: 'x'.repeat(41) })), 'name'));
  assert.ok(has(validateAccount(makeAccount({ type: 'gold' })), 'type'));
  assert.ok(has(validateAccount(makeAccount({ openingBalance: 10.5 })), 'openingBalance'));
  assert.ok(has(validateAccount(makeAccount({ openingBalance: '100' })), 'openingBalance'));
});

test('account: a negative opening balance is allowed (a credit card with debt)', () => {
  assert.deepEqual(validateAccount(makeAccount({ openingBalance: -50000 })), []);
});

test('category: kind and fields are checked', () => {
  assert.ok(has(validateCategory(makeCategory({ kind: 'transfer' })), 'kind'));
  assert.ok(has(validateCategory(makeCategory({ icon: '' })), 'icon'));
  assert.ok(has(validateCategory(makeCategory({ archived: 'no' })), 'archived'));
});

test('transaction: amount must be a positive whole number of paise', () => {
  for (const amount of [0, -5, 10.5, '100', NaN]) {
    assert.ok(has(validateTransaction(makeTxn({ amount })), 'amount'), `amount ${amount}`);
  }
});

test('transaction: bad or loose dates are refused', () => {
  for (const date of ['', 'yesterday', '5', null, 12345]) {
    assert.ok(has(validateTransaction(makeTxn({ date })), 'date'), `date ${date}`);
  }
});

test('transaction: income and expense need a category and no toAccountId', () => {
  assert.ok(has(validateTransaction(makeTxn({ categoryId: null })), 'categoryId'));
  assert.ok(has(validateTransaction(makeTxn({ toAccountId: 'bank' })), 'toAccountId'));
});

test('transaction: a valid transfer', () => {
  const transfer = makeTxn({ type: 'transfer', toAccountId: 'bank', categoryId: null });
  assert.deepEqual(validateTransaction(transfer), []);
});

test('transaction: transfer rules', () => {
  const base = { type: 'transfer', categoryId: null };
  assert.ok(has(validateTransaction(makeTxn({ ...base, toAccountId: null })), 'toAccountId'));
  assert.ok(has(validateTransaction(makeTxn({ ...base, toAccountId: 'cash' })), 'different'));
  assert.ok(has(validateTransaction(makeTxn({ ...base, toAccountId: 'bank', categoryId: 'food' })), 'category'));
});

test('transaction: note and tags must have the right type', () => {
  assert.ok(has(validateTransaction(makeTxn({ note: 5 })), 'note'));
  assert.ok(has(validateTransaction(makeTxn({ tags: 'a' })), 'tags'));
  assert.ok(has(validateTransaction(makeTxn({ tags: [1] })), 'tags'));
});

test('budget: limit must be positive paise', () => {
  assert.ok(has(validateBudget(makeBudget({ monthlyLimit: 0 })), 'monthlyLimit'));
  assert.ok(has(validateBudget(makeBudget({ monthlyLimit: 1.5 })), 'monthlyLimit'));
  assert.ok(has(validateBudget(makeBudget({ categoryId: '' })), 'categoryId'));
});

test('settings: known keys with right values pass, others fail', () => {
  assert.deepEqual(validateSetting('theme', 'dark'), []);
  assert.deepEqual(validateSetting('theme', null), []);
  assert.deepEqual(validateSetting('lastBackupAt', '2026-10-23T10:00:00.000Z'), []);
  assert.deepEqual(validateSetting('seeded', true), []);
  assert.ok(has(validateSetting('theme', 'blue'), 'theme'));
  assert.ok(has(validateSetting('seeded', 'yes'), 'seeded'));
  assert.ok(has(validateSetting('lastBackupAt', 'soon'), 'lastBackupAt'));
  assert.deepEqual(validateSetting('lastAccountId', null), []);
  assert.deepEqual(validateSetting('lastAccountId', 'abc'), []);
  assert.ok(has(validateSetting('lastAccountId', ''), 'lastAccountId'));
  assert.ok(has(validateSetting('lastAccountId', 5), 'lastAccountId'));
  assert.ok(has(validateSetting('colour', 'red'), 'unknown'));
});

test('every default setting is itself valid', () => {
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    assert.deepEqual(validateSetting(key, value), [], key);
  }
});

test('normalizeText trims text and leaves other values alone', () => {
  assert.equal(normalizeText('  Cash  '), 'Cash');
  assert.equal(normalizeText(5), 5);
  assert.equal(normalizeText(undefined), undefined);
});

test('assertValid throws with all the messages, and does nothing when empty', () => {
  assert.doesNotThrow(() => assertValid('accounts', []));
  assert.throws(() => assertValid('accounts', ['a is bad', 'b is bad']), /Invalid accounts: a is bad; b is bad/);
});
