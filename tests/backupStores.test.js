import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_STORES, backupStoreNames, storesInFile, listsOf } from '../src/core/backupStores.js';
import { validateBackup, BACKUP_APP_ID } from '../src/core/validateBackup.js';
import { summarizeImport } from '../src/core/importSummary.js';
import { makeAccount, makeCategory, makeTxn, makeBudget, makeRule, makeGoal, makeContribution, localIso } from './helpers.js';

const baseData = () => ({
  accounts: [makeAccount()],
  categories: [makeCategory()],
  transactions: [makeTxn({ id: 't1' })],
  budgets: [makeBudget()],
});
const makeBackup = (schemaVersion, extra = {}) => ({
  app: BACKUP_APP_ID,
  schemaVersion,
  exportedAt: localIso(2026, 9, 25),
  data: { ...baseData(), ...extra },
});
const has = (errors, word) => errors.some((message) => message.includes(word));

test('the table lists every store once, with since and a validator', () => {
  assert.deepEqual(backupStoreNames(), ['accounts', 'categories', 'transactions', 'budgets', 'recurring', 'goals', 'contributions', 'loans', 'repayments']);
  for (const store of BACKUP_STORES) {
    assert.equal(typeof store.validator, 'function');
    assert.ok(Number.isInteger(store.since) && store.since >= 1);
    assert.equal(store.label.length, 2);
  }
});

test('storesInFile: an old file does not contain the newer stores', () => {
  assert.equal(storesInFile(1).some((store) => store.name === 'recurring'), false);
  assert.equal(storesInFile(2).some((store) => store.name === 'recurring'), true);
});

test('a version 1 backup is valid and imports with the newer lists empty', () => {
  const backup = makeBackup(1);
  assert.deepEqual(validateBackup(backup, 3), []);
  const lists = listsOf(backup);
  assert.deepEqual(lists.recurring, []);
  assert.deepEqual([lists.goals, lists.contributions], [[], []]);
  assert.equal(lists.transactions.length, 1);
});

test('a version 1 file cannot sneak recurring rules in (they are ignored)', () => {
  const backup = makeBackup(1, { recurring: [makeRule({ amount: -5 })] });
  assert.deepEqual(validateBackup(backup, 2), []);
  assert.deepEqual(listsOf(backup).recurring, []);
});

test('a version 2 backup with rules is valid; broken rules and missing list are refused', () => {
  assert.deepEqual(validateBackup(makeBackup(2, { recurring: [makeRule()] }), 2), []);
  assert.ok(has(validateBackup(makeBackup(2, { recurring: [makeRule({ frequency: 'x' })] }), 2), 'recurring[0]'));
  assert.ok(has(validateBackup(makeBackup(2), 2), 'data.recurring must be a list'));
});

test('a rule that points to a missing account is allowed (it is shown as blocked)', () => {
  assert.deepEqual(validateBackup(makeBackup(2, { recurring: [makeRule({ accountId: 'gone' })] }), 2), []);
});

test('a backup from a newer app is refused', () => {
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [] }), 2), 'newer version'));
});

test('summarizeImport mentions recurring rules only when there are some', () => {
  const counts = { accounts: 1, categories: 2, transactions: 3, budgets: 0, recurring: 0 };
  assert.equal(summarizeImport(counts), '1 account, 2 categories, 3 transactions, 0 budgets');
  assert.equal(summarizeImport({ ...counts, recurring: 1 }), '1 account, 2 categories, 3 transactions, 0 budgets, 1 recurring rule');
  assert.ok(summarizeImport({ ...counts, recurring: 4 }).endsWith('4 recurring rules'));
});

test('a version 2 backup (made before goals) is valid and imports with goals empty', () => {
  const backup = makeBackup(2, { recurring: [makeRule()] });
  assert.deepEqual(validateBackup(backup, 3), []);
  const lists = listsOf(backup);
  assert.equal(lists.recurring.length, 1);
  assert.deepEqual([lists.goals, lists.contributions], [[], []]);
});

test('a version 3 backup with goals is valid; broken or orphan items and a missing list are refused', () => {
  const good = makeBackup(3, { recurring: [], goals: [makeGoal()], contributions: [makeContribution()] });
  assert.deepEqual(validateBackup(good, 3), []);
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [], goals: [makeGoal({ targetAmount: 0 })], contributions: [] }), 3), 'goals[0]'));
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [], goals: [makeGoal()], contributions: [makeContribution({ amount: -1 })] }), 3), 'contributions[0]'));
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [], goals: [], contributions: [makeContribution()] }), 3), 'goal not found'));
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [], contributions: [] }), 3), 'data.goals must be a list'));
});

test('a version 2 file cannot sneak goals in, and a version 3 file is refused by an older app', () => {
  const sneaky = makeBackup(2, { recurring: [], goals: [makeGoal({ targetAmount: -1 })] });
  assert.deepEqual(validateBackup(sneaky, 3), []);
  assert.deepEqual(listsOf(sneaky).goals, []);
  assert.ok(has(validateBackup(makeBackup(3, { recurring: [], goals: [], contributions: [] }), 2), 'newer version'));
});

test('importSummary mentions goals only when the backup has some', () => {
  const base = { accounts: 1, categories: 1, transactions: 1, budgets: 1, recurring: 0, goals: 0, contributions: 0 };
  assert.equal(summarizeImport(base), '1 account, 1 category, 1 transaction, 1 budget');
  assert.equal(summarizeImport({ ...base, goals: 2, contributions: 1 }), '1 account, 1 category, 1 transaction, 1 budget, 2 goals, 1 goal contribution');
});
