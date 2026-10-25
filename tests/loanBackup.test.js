import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBackup, BACKUP_APP_ID } from '../src/core/validateBackup.js';
import { listsOf } from '../src/core/backupStores.js';
import { summarizeImport } from '../src/core/importSummary.js';
import { buildDashboardModel } from '../src/core/dashboardModel.js';
import { buildCsv } from '../src/core/csv.js';
import { getPeriodTotals } from '../src/core/reports.js';
import { makeAccount, makeCategory, makeTxn, makeLoan, makeRepayment, localIso } from './helpers.js';
import { readFileSync } from 'node:fs';

const file = (version, extra = {}) => ({
  app: BACKUP_APP_ID,
  schemaVersion: version,
  exportedAt: localIso(2026, 9, 25),
  data: { accounts: [makeAccount()], categories: [makeCategory()], transactions: [], budgets: [], recurring: [], goals: [], contributions: [], ...extra },
});
const has = (errors, text) => errors.some((error) => error.includes(text));

test('a version 3 backup (made before loans) is valid and imports with loans empty', () => {
  const backup = file(3);
  assert.deepEqual(validateBackup(backup, 4), []);
  const lists = listsOf(backup);
  assert.deepEqual([lists.loans, lists.repayments], [[], []]);
});

test('a version 4 backup with loans is valid; broken, orphan or too large repayments are refused', () => {
  const good = file(4, { loans: [makeLoan()], repayments: [makeRepayment()] });
  assert.deepEqual(validateBackup(good, 4), []);
  assert.ok(has(validateBackup(file(4, { loans: [makeLoan({ amount: 0 })], repayments: [] }), 4), 'loans[0]'));
  assert.ok(has(validateBackup(file(4, { loans: [makeLoan({ accountId: 'zzz' })], repayments: [] }), 4), 'loans[0]: account not found'));
  assert.ok(has(validateBackup(file(4, { loans: [], repayments: [makeRepayment()] }), 4), 'loan not found'));
  assert.ok(has(validateBackup(file(4, { loans: [makeLoan()], repayments: [makeRepayment({ accountId: 'zzz' })] }), 4), 'repayments[0]: account not found'));
  const big = [makeRepayment({ amount: 60000 }), makeRepayment({ id: 'p2', amount: 40001 })];
  assert.ok(has(validateBackup(file(4, { loans: [makeLoan()], repayments: big }), 4), 'more than the loan'));
  assert.deepEqual(validateBackup(file(4, { loans: [makeLoan()], repayments: [makeRepayment({ amount: 60000 }), makeRepayment({ id: 'p2', amount: 40000 })] }), 4), []);
  assert.ok(has(validateBackup(file(4, { loans: [] }), 4), 'data.repayments must be a list'));
});

test('a version 4 file is refused by an older app; a version 3 file cannot sneak loans in', () => {
  assert.ok(has(validateBackup(file(4, { loans: [], repayments: [] }), 3), 'newer version'));
  const sneaky = file(3, { loans: [makeLoan({ amount: -1 })] });
  assert.deepEqual(validateBackup(sneaky, 4), []);
  assert.deepEqual(listsOf(sneaky).loans, []);
});

test('importSummary mentions loans only when the backup has some', () => {
  const base = { accounts: 1, categories: 1, transactions: 1, budgets: 1, recurring: 0, goals: 0, contributions: 0, loans: 0, repayments: 0 };
  assert.equal(summarizeImport(base), '1 account, 1 category, 1 transaction, 1 budget');
  assert.equal(summarizeImport({ ...base, loans: 2, repayments: 1 }), '1 account, 1 category, 1 transaction, 1 budget, 2 loans, 1 repayment');
});

test('loans move the Home total but never the month card, reports or CSV', () => {
  const accounts = [makeAccount({ openingBalance: 500000 })];
  const transactions = [makeTxn({ id: 't1', date: localIso(2026, 9, 20), amount: 20000 })];
  const now = new Date(2026, 9, 25, 10);
  const plain = buildDashboardModel({ accounts, transactions }, now);
  const withLoans = buildDashboardModel({ accounts, transactions, loans: [makeLoan(), makeLoan({ id: 'b', direction: 'borrowed', amount: 25000 })], repayments: [makeRepayment()] }, now);
  assert.equal(withLoans.total, plain.total - 100000 + 25000 + 30000);
  assert.deepEqual(withLoans.month, plain.month);
  assert.deepEqual(withLoans.recent, plain.recent);
  assert.deepEqual(withLoans.owed, { toYou: 70000, youOwe: 25000 });
  assert.deepEqual(plain.owed, { toYou: 0, youOwe: 0 });
});

test('the files of reports, budgets, filters and CSV do not know loans at all', () => {
  for (const name of ['reports', 'reportModel', 'budgets', 'budgetList', 'transactionFilter', 'csv']) {
    assert.doesNotMatch(readFileSync(new URL(`../src/core/${name}.js`, import.meta.url), 'utf8'), /loan|repayment/i, name);
  }
  assert.equal(getPeriodTotals([], { start: localIso(2026, 9, 1), end: localIso(2026, 10, 1) }).income, 0);
  assert.equal(buildCsv([], [], []).trim().split('\n').length, 1);
});
