import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundPercents } from '../src/core/percentSplit.js';

const sum = (list) => list.reduce((a, b) => a + b, 0);

test('roundPercents: thirds add up to exactly 100', () => {
  const result = roundPercents([100, 100, 100]);
  assert.equal(sum(result), 100);
  assert.deepEqual(result, [34, 33, 33]); // the tie goes to the earlier item
});

test('roundPercents: many awkward splits always sum to 100', () => {
  for (const values of [[1, 1, 1, 1, 1, 1, 1], [7, 11, 13, 17, 19, 23], [1, 99999], [333, 333, 334], [5, 5, 5, 5, 5, 5]]) {
    assert.equal(sum(roundPercents(values)), 100, values.join(','));
  }
});

test('roundPercents: exact halves stay exact, a single value is 100', () => {
  assert.deepEqual(roundPercents([50, 50]), [50, 50]);
  assert.deepEqual(roundPercents([12345]), [100]);
});

test('roundPercents: tiny share rounds to 0 but the rest still sum to 100', () => {
  const result = roundPercents([1, 100000]);
  assert.equal(result[0], 0);
  assert.equal(sum(result), 100);
});

test('roundPercents: zero total or empty gives zeros, no NaN', () => {
  assert.deepEqual(roundPercents([0, 0]), [0, 0]);
  assert.deepEqual(roundPercents([]), []);
});
