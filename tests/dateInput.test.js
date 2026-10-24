import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalInputValue, fromLocalInputValue } from '../src/core/dateInput.js';
import { localIso } from './helpers.js';

test('toLocalInputValue gives local time to the minute', () => {
  assert.equal(toLocalInputValue(localIso(2026, 9, 24, 14)), '2026-10-24T14:00');
});

test('toLocalInputValue: bad values give empty text (null is not 1970)', () => {
  assert.equal(toLocalInputValue(null), '');
  assert.equal(toLocalInputValue('nope'), '');
});

test('fromLocalInputValue is the opposite of toLocalInputValue', () => {
  assert.equal(fromLocalInputValue('2026-10-24T14:00'), localIso(2026, 9, 24, 14));
  const iso = localIso(2026, 0, 1, 0);
  assert.equal(fromLocalInputValue(toLocalInputValue(iso)), iso);
});

test('fromLocalInputValue refuses text that is not a real time', () => {
  assert.equal(fromLocalInputValue(''), null);
  assert.equal(fromLocalInputValue('2026-10-24'), null);
  assert.equal(fromLocalInputValue('2026-02-31T10:00'), null);
  assert.equal(fromLocalInputValue('2026-10-24T25:00'), null);
});
