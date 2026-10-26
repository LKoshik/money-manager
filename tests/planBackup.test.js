import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBackup, BACKUP_APP_ID } from '../src/core/validateBackup.js';
import { listsOf, storesInFile } from '../src/core/backupStores.js';
import { summarizeImport } from '../src/core/importSummary.js';
import { makeAccount, makeCategory, makePlan, makeExtraIncome, makeGiftTxn, localIso } from './helpers.js';

const file = (version, extra = {}) => ({
  app: BACKUP_APP_ID,
  schemaVersion: version,
  exportedAt: localIso(2026, 9, 25),
  data: { accounts: [makeAccount()], categories: [makeCategory()], transactions: [], budgets: [], recurring: [], goals: [], contributions: [], loans: [], repayments: [], ...extra },
});
const has = (errors, text) => errors.some((error) => error.includes(text));

test('a version 4 backup (made before the planner) is valid and imports with plans empty', () => {
  const backup = file(4);
  assert.deepEqual(validateBackup(backup, 5), []);
  assert.deepEqual(listsOf(backup).plans, []);
  assert.equal(storesInFile(4).some((store) => store.name === 'plans'), false);
  assert.equal(storesInFile(5).some((store) => store.name === 'plans'), true);
});

test('a version 5 backup with plan versions is valid and keeps them', () => {
  const plans = [makePlan(), makePlan({ id: 'pl2', appliesFrom: '2026-12' })];
  const backup = file(5, { plans });
  assert.deepEqual(validateBackup(backup, 5), []);
  assert.deepEqual(listsOf(backup).plans, plans);
});

test('broken plans, two versions for one month and a missing list are refused', () => {
  assert.ok(has(validateBackup(file(5, { plans: [makePlan({ income: -5 })] }), 5), 'plans[0]'));
  assert.ok(has(validateBackup(file(5, { plans: [makePlan({ buckets: [{ id: 'b', name: '', amount: 5 }] })] }), 5), 'plans[0]'));
  assert.ok(has(validateBackup(file(5, { plans: [makePlan(), makePlan({ id: 'pl2' })] }), 5), 'second version'));
  assert.ok(has(validateBackup(file(5, { plans: [makePlan(), makePlan()] }), 5), 'id is used twice'));
  assert.ok(has(validateBackup(file(5), 5), 'data.plans must be a list'));
});

test('a version 5 file is refused by an older app; a version 4 file cannot sneak plans in', () => {
  assert.ok(has(validateBackup(file(5, { plans: [] }), 4), 'newer version'));
  const sneaky = file(4, { plans: [makePlan({ income: -1 })] });
  assert.deepEqual(validateBackup(sneaky, 5), []);
  assert.deepEqual(listsOf(sneaky).plans, []);
});

test('importSummary mentions plan versions only when the backup has some', () => {
  const base = { accounts: 1, categories: 1, transactions: 1, budgets: 1, plans: 0 };
  assert.equal(summarizeImport(base), '1 account, 1 category, 1 transaction, 1 budget');
  assert.equal(summarizeImport({ ...base, plans: 1 }), '1 account, 1 category, 1 transaction, 1 budget, 1 plan version');
  assert.equal(summarizeImport({ ...base, plans: 3 }), '1 account, 1 category, 1 transaction, 1 budget, 3 plan versions');
});

test('the planner is paper only: transaction, report, balance and goal files know nothing about plans', () => {
  for (const name of ['reports', 'reportModel', 'budgets', 'balance', 'transactionFilter', 'csv', 'dashboardModel', 'goalModel', 'contributionRules']) {
    assert.doesNotMatch(readFileSync(new URL(`../src/core/${name}.js`, import.meta.url), 'utf8'), /planner|plansRepo|\bplans\b/i, name);
  }
});

// ---- Planner phase 3: extra income (schema version 6) ----
const file6 = (extra = {}) => file(6, { plans: [], transactions: [makeGiftTxn()], extraIncomes: [makeExtraIncome()], ...extra });

test('a version 5 backup (made before extra income) is valid and imports with extra income empty', () => {
  const backup = file(5, { plans: [] });
  assert.deepEqual(validateBackup(backup, 6), []);
  assert.deepEqual(listsOf(backup).extraIncomes, []);
  assert.equal(storesInFile(5).some((store) => store.name === 'extraIncomes'), false);
  assert.equal(storesInFile(6).some((store) => store.name === 'extraIncomes'), true);
});

test('a version 6 backup keeps its extra income entries', () => {
  const backup = file6();
  assert.deepEqual(validateBackup(backup, 6), []);
  assert.deepEqual(listsOf(backup).extraIncomes, [makeExtraIncome()]);
});

test('extra income: a split that does not add up, a missing or doubled transaction, or a missing list is refused', () => {
  assert.ok(has(validateBackup(file6({ extraIncomes: [makeExtraIncome({ wishes: 1 })] }), 6), 'extraIncomes[0]'));
  assert.ok(has(validateBackup(file6({ transactions: [] }), 6), 'income transaction not found'));
  assert.ok(has(validateBackup(file6({ extraIncomes: [makeExtraIncome(), makeExtraIncome({ id: 'e2' })] }), 6), 'used by another entry'));
  assert.ok(has(validateBackup(file6({ extraIncomes: undefined }), 6), 'data.extraIncomes must be a list'));
  assert.ok(has(validateBackup(file6(), 5), 'newer version'));
});

test('importSummary mentions extra income only when the backup has some', () => {
  const base = { accounts: 1, categories: 1, transactions: 1, budgets: 1, extraIncomes: 0 };
  assert.equal(summarizeImport(base), '1 account, 1 category, 1 transaction, 1 budget');
  assert.equal(summarizeImport({ ...base, extraIncomes: 2 }), '1 account, 1 category, 1 transaction, 1 budget, 2 extra incomes');
});
