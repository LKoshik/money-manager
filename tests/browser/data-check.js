/**
 * Checks for the data/ layer. IndexedDB only exists in a browser, so these
 * run on a page (data-check.html), not with "npm test".
 * It uses its OWN database name, so your real data is never touched.
 */

import { useDatabaseName, deleteDb, closeDb, DB_VERSION, requestPersistentStorage } from '../../src/data/db.js';
import { accountsRepo } from '../../src/data/accountsRepo.js';
import { categoriesRepo } from '../../src/data/categoriesRepo.js';
import { transactionsRepo } from '../../src/data/transactionsRepo.js';
import { budgetsRepo } from '../../src/data/budgetsRepo.js';
import { settingsRepo } from '../../src/data/settingsRepo.js';
import { seedIfFirstLaunch } from '../../src/data/seed.js';
import { createBackupFile, createCsvFile, importBackup, markBackupDone, BackupError } from '../../src/data/backup.js';
import { calculateBalances } from '../../src/core/balance.js';

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectFails(promise, word) {
  try {
    await promise;
  } catch (error) {
    expect(String(error.message).includes(word), `error should mention "${word}", but says: ${error.message}`);
    return;
  }
  throw new Error(`should have failed (${word})`);
}

const ctx = {}; // items shared between the checks, in order

const CHECKS = [
  ['database has the right version', async () => {
    const { openDb } = await import('../../src/data/db.js');
    expect((await openDb()).version === DB_VERSION, 'wrong version');
  }],
  ['first launch adds default categories, second launch adds nothing', async () => {
    expect((await seedIfFirstLaunch()) === true, 'should seed the first time');
    expect((await seedIfFirstLaunch()) === false, 'should not seed twice');
    const all = await categoriesRepo.list();
    expect(all.length === 17, `expected 17 categories, got ${all.length}`);
    expect((await categoriesRepo.list({ kind: 'income' })).length === 5, 'expected 5 income categories');
  }],
  ['accounts: create, list, update, archive', async () => {
    ctx.cash = await accountsRepo.create({ name: '  Cash  ', type: 'cash', openingBalance: 100000 });
    ctx.bank = await accountsRepo.create({ name: 'Bank', type: 'bank', openingBalance: 500000 });
    ctx.spare = await accountsRepo.create({ name: 'Spare', type: 'upi' });
    expect(ctx.cash.name === 'Cash', 'name should be trimmed');
    const renamed = await accountsRepo.update(ctx.bank.id, { openingBalance: 600000 });
    expect(renamed.name === 'Bank' && renamed.openingBalance === 600000, 'update lost a field');
    await accountsRepo.archive(ctx.spare.id);
    expect((await accountsRepo.list()).length === 2, 'archived account should be hidden');
    expect((await accountsRepo.list({ includeArchived: true })).length === 3, 'archived account should still exist');
    await accountsRepo.unarchive(ctx.spare.id);
  }],
  ['transactions: income, expense, transfer give the right balances', async () => {
    ctx.food = (await categoriesRepo.list()).find((c) => c.name === 'Food');
    ctx.salary = (await categoriesRepo.list()).find((c) => c.name === 'Salary');
    await transactionsRepo.create({ type: 'income', amount: 50000, date: '2026-10-01', accountId: ctx.cash.id, categoryId: ctx.salary.id });
    ctx.lunch = await transactionsRepo.create({ type: 'expense', amount: 25050, date: new Date(), accountId: ctx.cash.id, categoryId: ctx.food.id, note: ' lunch ', tags: ['work'] });
    await transactionsRepo.create({ type: 'transfer', amount: 20000, date: new Date(), accountId: ctx.bank.id, toAccountId: ctx.cash.id, categoryId: ctx.food.id });
    const balances = calculateBalances(await accountsRepo.list(), await transactionsRepo.getAll());
    expect(balances[ctx.cash.id] === 100000 + 50000 - 25050 + 20000, `cash is ${balances[ctx.cash.id]}`);
    expect(balances[ctx.bank.id] === 600000 - 20000, `bank is ${balances[ctx.bank.id]}`);
    expect(ctx.lunch.note === 'lunch', 'note should be trimmed');
  }],
  ['transfer: category is dropped, update sets updatedAt', async () => {
    const transfer = (await transactionsRepo.getAll()).find((t) => t.type === 'transfer');
    expect(transfer.categoryId === null, 'a transfer must not keep a category');
    const changed = await transactionsRepo.update(ctx.lunch.id, { amount: 30000 });
    expect(changed.amount === 30000 && changed.createdAt === ctx.lunch.createdAt, 'update changed the wrong things');
    expect(changed.updatedAt >= ctx.lunch.updatedAt, 'updatedAt should move forward');
  }],
  ['bad data is refused before saving', async () => {
    const base = { type: 'expense', amount: 100, date: new Date(), accountId: ctx.cash.id, categoryId: ctx.food.id };
    await expectFails(transactionsRepo.create({ ...base, amount: -5 }), 'amount');
    await expectFails(transactionsRepo.create({ ...base, amount: 10.5 }), 'amount');
    await expectFails(transactionsRepo.create({ ...base, date: 'nope' }), 'date');
    await expectFails(transactionsRepo.create({ ...base, type: 'transfer', toAccountId: ctx.cash.id }), 'different');
    await expectFails(accountsRepo.create({ name: '', type: 'cash' }), 'name');
    await expectFails(transactionsRepo.update('missing-id', { amount: 5 }), 'not found');
  }],
  ['account with transactions is archived, unused account is deleted', async () => {
    expect((await accountsRepo.removeOrArchive(ctx.cash.id)) === 'archived', 'cash has transactions');
    expect((await accountsRepo.getById(ctx.cash.id)).archived === true, 'cash should be archived');
    expect((await accountsRepo.removeOrArchive(ctx.spare.id)) === 'deleted', 'spare has no transactions');
    expect((await accountsRepo.getById(ctx.spare.id)) === null, 'spare should be gone');
    await accountsRepo.unarchive(ctx.cash.id);
  }],
  ['budgets: one per category, and they follow the category', async () => {
    const first = await budgetsRepo.setLimit(ctx.food.id, 500000);
    const second = await budgetsRepo.setLimit(ctx.food.id, 700000);
    expect(first.id === second.id && (await budgetsRepo.list()).length === 1, 'should update, not duplicate');
    await expectFails(budgetsRepo.setLimit(ctx.food.id, 0), 'monthlyLimit');
    expect((await categoriesRepo.removeOrArchive(ctx.food.id)) === 'archived', 'Food has transactions');
    expect((await budgetsRepo.list()).length === 1, 'archived category keeps its budget');
    const unused = (await categoriesRepo.list()).find((c) => c.name === 'Gifts');
    await budgetsRepo.setLimit(unused.id, 100000);
    expect((await categoriesRepo.removeOrArchive(unused.id)) === 'deleted', 'Gifts is unused');
    expect((await budgetsRepo.list()).length === 1, 'its budget should be deleted too');
    await categoriesRepo.unarchive(ctx.food.id);
  }],
  ['settings: defaults, save, and unknown keys', async () => {
    expect((await settingsRepo.get('theme')) === null, 'theme default is null');
    await settingsRepo.set('theme', 'dark');
    expect((await settingsRepo.get('theme')) === 'dark', 'theme was not saved');
    expect((await settingsRepo.getAll()).seeded === true, 'seeded flag missing');
    await expectFails(settingsRepo.set('theme', 'blue'), 'theme');
    await expectFails(settingsRepo.set('colour', 'red'), 'unknown');
    await markBackupDone(new Date(2026, 9, 23));
    expect((await settingsRepo.get('lastBackupAt')).startsWith('2026-10-2'), 'backup date not saved');
  }],
  ['backup: export, wipe, import gives exactly the same data', async () => {
    const file = await createBackupFile();
    const before = JSON.parse(file.text).data;
    await deleteDb();
    expect((await accountsRepo.list({ includeArchived: true })).length === 0, 'wipe failed');
    const counts = await importBackup(file.text);
    expect(counts.transactions === before.transactions.length, 'transaction count is different');
    expect(counts.categories === before.categories.length, 'category count is different');
    const after = JSON.parse((await createBackupFile()).text).data;
    expect(JSON.stringify(after) === JSON.stringify(before), 'data changed during the round trip');
    expect((await seedIfFirstLaunch()) === false, 'default categories must not come back after an import');
  }],
  ['backup: a bad file is refused and your data stays', async () => {
    const good = JSON.parse((await createBackupFile()).text);
    const count = async () => (await transactionsRepo.getAll()).length;
    const before = await count();
    await expectFails(importBackup('this is not json'), 'JSON');
    const damaged = structuredClone(good);
    damaged.data.transactions[0].amount = -1;
    await expectFails(importBackup(JSON.stringify(damaged)), 'amount');
    const wrongApp = { ...good, app: 'something-else' };
    await expectFails(importBackup(JSON.stringify(wrongApp)), 'Money Manager');
    expect((await count()) === before, 'a refused import must not change anything');
    try {
      await importBackup('{}');
    } catch (error) {
      expect(error instanceof BackupError && error.errors.length > 0, 'should be a BackupError with a list');
    }
  }],
  ['CSV file has a header and one row per transaction', async () => {
    const file = await createCsvFile(new Date(2026, 9, 23));
    expect(file.filename === 'money-manager-transactions-2026-10-23.csv', `filename is ${file.filename}`);
    const lines = file.text.trim().split('\r\n');
    expect(lines.length === 1 + (await transactionsRepo.getAll()).length, 'wrong number of rows');
    expect(lines[0].includes('Date,Type,Amount'), 'header is missing');
  }],
  ['asking the browser to protect storage gives true or false', async () => {
    expect(typeof (await requestPersistentStorage()) === 'boolean', 'should be a boolean');
  }],
];

/**
 * Run all checks in order, on a fresh test database.
 * @returns {Promise<Array<{name: string, ok: boolean, error?: string}>>}
 */
export async function runChecks() {
  await useDatabaseName('money-manager-check');
  await deleteDb();
  const results = [];
  for (const [name, check] of CHECKS) {
    try {
      await check();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, error: error.message });
    }
  }
  await closeDb();
  return results;
}
