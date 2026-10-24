import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRegisterWorker, isUpdateReady } from '../src/core/pwaUpdate.js';

test('the worker is registered only in the built app, on a secure address', () => {
  assert.equal(shouldRegisterWorker({ bundled: true, supported: true, secure: true }), true);
  assert.equal(shouldRegisterWorker({ bundled: false, supported: true, secure: true }), false);
  assert.equal(shouldRegisterWorker({ bundled: true, supported: false, secure: true }), false);
  assert.equal(shouldRegisterWorker({ bundled: true, supported: true, secure: false }), false);
});

test('an installed worker is an update only when the page already had a worker', () => {
  assert.equal(isUpdateReady({ workerState: 'installed', hasController: true }), true);
  assert.equal(isUpdateReady({ workerState: 'installed', hasController: false }), false); // first install
  assert.equal(isUpdateReady({ workerState: 'installing', hasController: true }), false);
  assert.equal(isUpdateReady({ workerState: 'activated', hasController: true }), false);
});
