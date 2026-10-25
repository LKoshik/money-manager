import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCOUNT_REFERENCES, CATEGORY_REFERENCES, referenceStores, isReferenced } from '../src/data/references.js';

/** A fake database transaction: counts[`store.index`] says how many records use the id. */
function fakeTx(counts) {
  const asked = [];
  return {
    asked,
    objectStore: (store) => ({
      index: (index) => ({
        count(id) {
          asked.push(`${store}.${index}:${id}`);
          const request = {};
          setTimeout(() => {
            request.result = counts[`${store}.${index}`] ?? 0;
            request.onsuccess();
          }, 0);
          return request;
        },
      }),
    }),
  };
}

test('the lists name transactions, recurring rules and (for accounts) loans and repayments', () => {
  assert.deepEqual(referenceStores(ACCOUNT_REFERENCES), ['transactions', 'recurring', 'loans', 'repayments']);
  assert.deepEqual(referenceStores(CATEGORY_REFERENCES), ['transactions', 'recurring']);
});

test('isReferenced: unused id is false, any single use is true', async () => {
  assert.equal(await isReferenced(fakeTx({}), ACCOUNT_REFERENCES, 'a1'), false);
  assert.equal(await isReferenced(fakeTx({ 'transactions.toAccountId': 1 }), ACCOUNT_REFERENCES, 'a1'), true);
  assert.equal(await isReferenced(fakeTx({ 'recurring.accountId': 2 }), ACCOUNT_REFERENCES, 'a1'), true);
  assert.equal(await isReferenced(fakeTx({ 'recurring.categoryId': 1 }), CATEGORY_REFERENCES, 'c1'), true);
  assert.equal(await isReferenced(fakeTx({ 'recurring.categoryId': 1 }), ACCOUNT_REFERENCES, 'c1'), false);
});

test('isReferenced asks every pair of the list (a later phase adds one pair)', async () => {
  const tx = fakeTx({});
  await isReferenced(tx, [...ACCOUNT_REFERENCES, ['future', 'accountId']], 'a1');
  assert.equal(tx.asked.length, 7);
  assert.ok(tx.asked.includes('loans.accountId:a1'));
  assert.ok(tx.asked.includes('repayments.accountId:a1'));
  assert.ok(tx.asked.includes('future.accountId:a1'));
});
