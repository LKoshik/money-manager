import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeImport, summarizeProblems } from '../src/core/importSummary.js';

test('summarizeImport: counts with correct singular and plural', () => {
  assert.equal(
    summarizeImport({ accounts: 2, categories: 17, transactions: 1, budgets: 0 }),
    '2 accounts, 17 categories, 1 transaction, 0 budgets',
  );
  assert.equal(summarizeImport({ accounts: 1, categories: 1, transactions: 1, budgets: 1 }), '1 account, 1 category, 1 transaction, 1 budget');
});

test('summarizeImport: missing counts read as 0', () => {
  assert.equal(summarizeImport({}), '0 accounts, 0 categories, 0 transactions, 0 budgets');
});

test('summarizeProblems: short lists stay as they are, long ones are cut', () => {
  assert.deepEqual(summarizeProblems(['a', 'b']), ['a', 'b']);
  const lines = summarizeProblems(['1', '2', '3', '4', '5', '6', '7']);
  assert.equal(lines.length, 6);
  assert.equal(lines[5], '...and 2 more problems.');
});
