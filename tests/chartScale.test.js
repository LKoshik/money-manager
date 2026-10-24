import { test } from 'node:test';
import assert from 'node:assert/strict';
import { niceAxis, formatAxisLabel } from '../src/core/chartScale.js';

test('niceAxis: exact fits stay tight', () => {
  const axis = niceAxis(100000); // Rs 1,000
  assert.equal(axis.max, 100000);
  assert.deepEqual(axis.ticks, [0, 25000, 50000, 75000, 100000]);
});

test('niceAxis: just above a step jumps to the next nice one', () => {
  assert.equal(niceAxis(100001).max, 200000);
});

test('niceAxis: the top is never below the largest value', () => {
  for (const value of [1, 99, 100, 101, 250, 12345, 999999, 5000000, 123456789012]) {
    assert.ok(niceAxis(value).max >= value, String(value));
  }
});

test('niceAxis: tiny values use steps of at least Rs 1', () => {
  assert.equal(niceAxis(1).step, 100);
});

test('niceAxis: zero, negative, NaN give a calm default', () => {
  for (const value of [0, -5, NaN, Infinity]) {
    const axis = niceAxis(value);
    assert.equal(axis.max, 100000);
    assert.equal(axis.ticks.length, 5);
  }
});

test('formatAxisLabel: short Indian-style labels', () => {
  assert.equal(formatAxisLabel(0), '₹0');
  assert.equal(formatAxisLabel(250), '₹2.5');
  assert.equal(formatAxisLabel(100000), '₹1k');
  assert.equal(formatAxisLabel(250000), '₹2.5k');
  assert.equal(formatAxisLabel(10000000), '₹1 L');
  assert.equal(formatAxisLabel(1000000000), '₹1 Cr');
});
