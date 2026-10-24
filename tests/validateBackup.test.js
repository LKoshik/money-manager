import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBackup, BACKUP_APP_ID } from '../src/core/validateBackup.js';
import { makeAccount, makeCategory, makeTxn, makeBudget, localIso } from './helpers.js';

/** A small, correct backup with one of everything. */
function makeBackup() {
  return {
    app: BACKUP_APP_ID,
    schemaVersion: 1,
    exportedAt: localIso(2026, 9, 23),
    data: {
      accounts: [makeAccount({ id: 'cash' }), makeAccount({ id: 'bank', name: 'Bank' })],
      categories: [makeCategory({ id: 'food' })],
      transactions: [
        makeTxn({ id: 't1', accountId: 'cash', categoryId: 'food' }),
        makeTxn({ id: 't2', type: 'transfer', accountId: 'cash', toAccountId: 'bank', categoryId: null }),
      ],
      budgets: [makeBudget({ id: 'b1', categoryId: 'food' })],
    },
  };
}

const has = (errors, word) => errors.some((message) => message.includes(word));

test('a correct backup has no problems', () => {
  assert.deepEqual(validateBackup(makeBackup(), 1), []);
});

test('an empty backup (all lists empty) is fine', () => {
  const backup = makeBackup();
  backup.data = { accounts: [], categories: [], transactions: [], budgets: [] };
  assert.deepEqual(validateBackup(backup, 1), []);
});

test('not an object, or not made by this app', () => {
  assert.equal(validateBackup(null, 1).length, 1);
  assert.equal(validateBackup('hello', 1).length, 1);
  assert.ok(has(validateBackup({ ...makeBackup(), app: 'other' }, 1), 'not a Money Manager'));
});

test('schema version: missing, wrong, or newer than the app', () => {
  assert.ok(has(validateBackup({ ...makeBackup(), schemaVersion: undefined }, 1), 'schemaVersion'));
  assert.ok(has(validateBackup({ ...makeBackup(), schemaVersion: 0 }, 1), 'schemaVersion'));
  assert.ok(has(validateBackup({ ...makeBackup(), schemaVersion: 2 }, 1), 'newer version'));
});

test('data missing, or a list missing', () => {
  assert.ok(has(validateBackup({ ...makeBackup(), data: undefined }, 1), 'data is missing'));
  const backup = makeBackup();
  delete backup.data.budgets;
  assert.ok(has(validateBackup(backup, 1), 'data.budgets must be a list'));
});

test('a bad item is reported with its place in the list', () => {
  const backup = makeBackup();
  backup.data.transactions[1].amount = -5;
  const errors = validateBackup(backup, 1);
  assert.ok(errors.some((message) => message.startsWith('transactions[1]:') && message.includes('amount')));
});

test('the same id used twice', () => {
  const backup = makeBackup();
  backup.data.accounts[1].id = 'cash';
  assert.ok(has(validateBackup(backup, 1), 'used twice'));
});

test('links: missing account, destination account and category', () => {
  const noAccount = makeBackup();
  noAccount.data.transactions[0].accountId = 'ghost';
  assert.ok(has(validateBackup(noAccount, 1), 'account not found'));

  const noDestination = makeBackup();
  noDestination.data.transactions[1].toAccountId = 'ghost';
  assert.ok(has(validateBackup(noDestination, 1), 'destination account not found'));

  const noCategory = makeBackup();
  noCategory.data.transactions[0].categoryId = 'ghost';
  assert.ok(has(validateBackup(noCategory, 1), 'category not found'));
});

test('budgets: missing category, or two budgets for one category', () => {
  const noCategory = makeBackup();
  noCategory.data.budgets[0].categoryId = 'ghost';
  assert.ok(has(validateBackup(noCategory, 1), 'category not found'));

  const twice = makeBackup();
  twice.data.budgets.push(makeBudget({ id: 'b2', categoryId: 'food' }));
  assert.ok(has(validateBackup(twice, 1), 'second budget'));
});

test('many problems: only the first 20 are listed, plus a count', () => {
  const backup = makeBackup();
  backup.data.transactions = Array.from({ length: 30 }, (_, i) => makeTxn({ id: `t${i}`, amount: -1 }));
  const errors = validateBackup(backup, 1);
  assert.equal(errors.length, 21);
  assert.match(errors[20], /and \d+ more problems/);
});
