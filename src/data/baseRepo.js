/**
 * Shared IndexedDB plumbing, so each repository stays small.
 * IndexedDB uses old-style callbacks. Here we turn them into promises
 * (so we can use async/await) and in one place only.
 *
 * RULE for every repository function: it always RETURNS A PROMISE. A problem
 * (like invalid data) is a rejected promise, never a sudden throw. That is why
 * these functions are marked "async" even when they look like they do not need it.
 */

import { openDb } from './db.js';
import { assertValid } from '../core/validate.js';

/**
 * Turn one IndexedDB request into a promise.
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
export function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Run work inside one database transaction over one or more stores.
 * All changes happen together or not at all. The promise finishes only after
 * the data is really saved. If the work throws, everything is rolled back.
 * IMPORTANT: inside "work" only await database requests, nothing else
 * (like fetch), or the browser closes the transaction early.
 * @param {string[]} storeNames
 * @param {'readonly'|'readwrite'} mode
 * @param {(tx: IDBTransaction) => Promise<any>} work
 * @returns {Promise<any>} Whatever "work" returns.
 */
export async function withTransaction(storeNames, mode, work) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    let result;
    let failure;
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(failure ?? tx.error ?? new Error('Database transaction was cancelled'));
    work(tx).then(
      (value) => {
        result = value;
      },
      (error) => {
        failure = error;
        try {
          tx.abort();
        } catch {
          reject(error); // the transaction was already finished
        }
      },
    );
  });
}

/**
 * Save many items into a store at the same time.
 * @param {IDBObjectStore} store
 * @param {object[]} items
 * @returns {Promise<void>}
 */
export async function putAll(store, items) {
  await Promise.all(items.map((item) => promisify(store.put(item))));
}

/**
 * Make the basic operations for one store. Each entity repository
 * starts from this and adds its own rules.
 * @param {string} storeName
 * @param {(item: object) => string[]} validate  Returns a list of problems.
 */
export function createBaseRepo(storeName, validate) {
  const run = (mode, action) =>
    withTransaction([storeName], mode, (tx) => action(tx.objectStore(storeName)));

  return {
    getAll: () => run('readonly', (store) => promisify(store.getAll())),

    getById: async (id) => (await run('readonly', (store) => promisify(store.get(id)))) ?? null,

    /** Validate, then save (adds a new item or replaces the old one). */
    async put(item) {
      assertValid(storeName, validate(item));
      return run('readwrite', async (store) => {
        await promisify(store.put(item));
        return item;
      });
    },

    /** Change some fields of an existing item. */
    update: (id, changes) =>
      run('readwrite', async (store) => {
        const current = await promisify(store.get(id));
        if (!current) throw new Error(`${storeName}: item not found (${id})`);
        const merged = { ...current, ...changes, id }; // the id can never change
        assertValid(storeName, validate(merged));
        await promisify(store.put(merged));
        return merged;
      }),

    remove: (id) => run('readwrite', (store) => promisify(store.delete(id))),
  };
}
