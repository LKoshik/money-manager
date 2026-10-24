import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeStorage } from '../src/core/storageStatus.js';

test('describeStorage: only "unprotected" offers the protect button', () => {
  assert.equal(describeStorage('unprotected').canProtect, true);
  for (const status of ['checking', 'protected', 'unsupported']) assert.equal(describeStorage(status).canProtect, false, status);
});

test('describeStorage: every status has a title; unknown values act like unsupported', () => {
  for (const status of ['checking', 'protected', 'unprotected', 'unsupported']) assert.ok(describeStorage(status).title);
  assert.equal(describeStorage('???').title, describeStorage('unsupported').title);
});
