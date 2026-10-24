/**
 * Backup: export all data to a JSON file, import it back, export a CSV.
 * This file only makes the TEXT of the files and reads them. Saving a file
 * to the phone and picking a file are DOM jobs for the settings screen.
 */

import { DB_VERSION } from './db.js';
import { withTransaction, promisify, putAll } from './baseRepo.js';
import { BACKUP_APP_ID, validateBackup } from '../core/validateBackup.js';
import { buildCsv } from '../core/csv.js';
import { toDayKey } from '../core/dates.js';
import { settingsRepo } from './settingsRepo.js';

const DATA_STORES = ['accounts', 'categories', 'transactions', 'budgets'];

/** Thrown when a backup file cannot be used. "errors" lists the problems. */
export class BackupError extends Error {
  /** @param {string[]} errors */
  constructor(errors) {
    super(`Backup file is not valid: ${errors[0]}`);
    this.name = 'BackupError';
    this.errors = errors;
  }
}

/** Read a whole store list at once, in one transaction, so the data is consistent. */
function readStores(names) {
  return withTransaction(names, 'readonly', async (tx) => {
    const lists = await Promise.all(names.map((name) => promisify(tx.objectStore(name).getAll())));
    return Object.fromEntries(names.map((name, index) => [name, lists[index]]));
  });
}

/**
 * Make the JSON backup file.
 * Does NOT change "last backup date": call markBackupDone() after the file is saved.
 * @param {Date} [now=new Date()]
 * @returns {Promise<{filename: string, mime: string, text: string}>}
 */
export async function createBackupFile(now = new Date()) {
  const backup = {
    app: BACKUP_APP_ID,
    schemaVersion: DB_VERSION,
    exportedAt: now.toISOString(),
    data: await readStores(DATA_STORES),
  };
  return {
    filename: `money-manager-backup-${toDayKey(now.toISOString())}.json`,
    mime: 'application/json',
    text: JSON.stringify(backup, null, 2),
  };
}

/**
 * Make the CSV file of all transactions.
 * @param {Date} [now=new Date()]
 * @returns {Promise<{filename: string, mime: string, text: string}>}
 */
export async function createCsvFile(now = new Date()) {
  const { accounts, categories, transactions } = await readStores(['accounts', 'categories', 'transactions']);
  return {
    filename: `money-manager-transactions-${toDayKey(now.toISOString())}.csv`,
    mime: 'text/csv;charset=utf-8',
    text: buildCsv(transactions, accounts, categories),
  };
}

/**
 * Remember that a backup was just saved (for the "last backup" date).
 * @param {Date} [now=new Date()]
 * @returns {Promise<void>}
 */
export function markBackupDone(now = new Date()) {
  return settingsRepo.set('lastBackupAt', now.toISOString());
}

/** Turn text into an object, with a clear error if it is not JSON. */
function parseBackupText(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new BackupError(['this file is not valid JSON']);
  }
}

/** Replace everything in one transaction: if anything fails, your old data stays. */
function replaceAllData(data) {
  return withTransaction([...DATA_STORES, 'settings'], 'readwrite', async (tx) => {
    await Promise.all(DATA_STORES.map((name) => promisify(tx.objectStore(name).clear())));
    for (const name of DATA_STORES) await putAll(tx.objectStore(name), data[name]);
    // The imported data has its own categories, so we must not add defaults later.
    await promisify(tx.objectStore('settings').put({ key: 'seeded', value: true }));
  });
}

/**
 * Import a backup file. It REPLACES all data in the app, so the screen must
 * ask the person to confirm first. The file is fully checked before anything changes.
 * @param {string} text  The content of the JSON file.
 * @returns {Promise<{accounts: number, categories: number, transactions: number, budgets: number}>}
 *   How many items were imported.
 * @throws {BackupError} If the file is not a valid backup.
 */
export async function importBackup(text) {
  const backup = parseBackupText(text);
  const errors = validateBackup(backup, DB_VERSION);
  if (errors.length > 0) throw new BackupError(errors);
  await replaceAllData(backup.data);
  return Object.fromEntries(DATA_STORES.map((name) => [name, backup.data[name].length]));
}
