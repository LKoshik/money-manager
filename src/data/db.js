/**
 * Opens the IndexedDB database and keeps its structure up to date.
 *
 * HOW MIGRATIONS WORK: the database has a version number. MIGRATIONS is a list;
 * item 0 builds version 1, item 1 will change version 1 into version 2, and so on.
 * When the app opens a database with an older version, only the missing steps run.
 * Rule: NEVER edit an old migration. Always add a new one at the end.
 */

const DEFAULT_DB_NAME = 'money-manager';

// Private to this file (not shared with other files).
let dbName = DEFAULT_DB_NAME;
let dbPromise = null; // we open the database once and reuse it

const MIGRATIONS = [
  function createVersion1(db) {
    db.createObjectStore('accounts', { keyPath: 'id' });
    db.createObjectStore('categories', { keyPath: 'id' });
    const transactions = db.createObjectStore('transactions', { keyPath: 'id' });
    // These indexes let us ask "does this account/category have transactions?" fast.
    transactions.createIndex('accountId', 'accountId');
    transactions.createIndex('toAccountId', 'toAccountId');
    transactions.createIndex('categoryId', 'categoryId');
    const budgets = db.createObjectStore('budgets', { keyPath: 'id' });
    budgets.createIndex('categoryId', 'categoryId', { unique: true }); // one budget per category
    db.createObjectStore('settings', { keyPath: 'key' });
  },
  function createVersion2(db) {
    // Phase 10: recurring rules. The indexes answer "is this account/category used by a rule?".
    const recurring = db.createObjectStore('recurring', { keyPath: 'id' });
    recurring.createIndex('accountId', 'accountId');
    recurring.createIndex('toAccountId', 'toAccountId');
    recurring.createIndex('categoryId', 'categoryId');
  },
  function createVersion3(db) {
    // Phase 11: savings goals and their contributions. The index finds one goal's contributions fast.
    db.createObjectStore('goals', { keyPath: 'id' });
    const contributions = db.createObjectStore('contributions', { keyPath: 'id' });
    contributions.createIndex('goalId', 'goalId');
  },
  function createVersion4(db) {
    // Phase 12: lent / borrowed money. The indexes answer "is this account used by a loan?"
    // and "which repayments belong to this loan?".
    const loans = db.createObjectStore('loans', { keyPath: 'id' });
    loans.createIndex('accountId', 'accountId');
    const repayments = db.createObjectStore('repayments', { keyPath: 'id' });
    repayments.createIndex('loanId', 'loanId');
    repayments.createIndex('accountId', 'accountId');
  },
];

/** The schema version of the database. It is simply how many migrations exist. */
export const DB_VERSION = MIGRATIONS.length;

/**
 * Run the migration steps that this database has not seen yet.
 * @param {IDBDatabase} db
 * @param {IDBTransaction} transaction  The upgrade transaction (future steps may need it).
 * @param {number} oldVersion  0 for a brand new database.
 */
export function runMigrations(db, transaction, oldVersion) {
  for (let step = oldVersion; step < MIGRATIONS.length; step += 1) {
    MIGRATIONS[step](db, transaction);
  }
}

/**
 * Open the database (the first call opens it, later calls reuse it).
 * @returns {Promise<IDBDatabase>}
 */
export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);
    request.onupgradeneeded = (event) =>
      runMigrations(request.result, request.transaction, event.oldVersion);
    request.onsuccess = () => {
      const db = request.result;
      // Another tab wants to upgrade: let go, so it is not blocked.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

/** Close the database connection. The next openDb() opens it again. */
export async function closeDb() {
  if (!dbPromise) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

/**
 * Delete the whole database. Used by tests only.
 * @returns {Promise<void>}
 */
export async function deleteDb() {
  await closeDb();
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other tabs that use this database.'));
  });
}

/**
 * Use a different database name. Used by the browser check page, so that
 * testing never touches your real data.
 * @param {string} name
 */
export async function useDatabaseName(name) {
  await closeDb();
  dbName = name;
}

/**
 * Ask the browser to keep our data safe (not clean it up when storage is low).
 * Call once on first launch.
 * @returns {Promise<boolean>} true if storage is now protected.
 */
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false; // not important enough to crash the app
  }
}
