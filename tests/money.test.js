import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rupeesToPaise, formatPlain, formatMoney } from '../src/core/money.js';

test('rupeesToPaise: reads normal text amounts', () => {
  assert.equal(rupeesToPaise('250.50'), 25050);
  assert.equal(rupeesToPaise('250'), 25000);
  assert.equal(rupeesToPaise('0.5'), 50);
  assert.equal(rupeesToPaise('250.'), 25000);
  assert.equal(rupeesToPaise('.5'), 50);
  assert.equal(rupeesToPaise(' 99.99 '), 9999);
});

test('rupeesToPaise: accepts Indian commas', () => {
  assert.equal(rupeesToPaise('1,00,000'), 10000000);
});

test('rupeesToPaise: numbers are rounded without float error', () => {
  assert.equal(rupeesToPaise(250.5), 25050);
  assert.equal(rupeesToPaise(0.1 + 0.2), 30);
});

test('rupeesToPaise: negative values work, and -0 becomes 0', () => {
  assert.equal(rupeesToPaise('-12.5'), -1250);
  assert.equal(rupeesToPaise('-0'), 0);
});

test('rupeesToPaise: bad input gives null', () => {
  for (const bad of ['abc', '', '-', '.', '1.234', '1.2.3', '12 34', null, undefined, NaN, Infinity]) {
    assert.equal(rupeesToPaise(bad), null, `should reject ${String(bad)}`);
  }
});

test('formatPlain: always 2 decimals, no symbol', () => {
  assert.equal(formatPlain(25050), '250.50');
  assert.equal(formatPlain(100), '1.00');
  assert.equal(formatPlain(5), '0.05');
  assert.equal(formatPlain(0), '0.00');
  assert.equal(formatPlain(-5), '-0.05');
});

test('formatPlain and rupeesToPaise are opposites', () => {
  for (const paise of [0, 1, 99, 100, 25050, 10000000, -1250]) {
    assert.equal(rupeesToPaise(formatPlain(paise)), paise);
  }
});

test('formatMoney: Indian style with rupee symbol', () => {
  assert.equal(formatMoney(10000000), '₹1,00,000.00');
  assert.equal(formatMoney(25050), '₹250.50');
  assert.equal(formatMoney(0), '₹0.00');
  assert.equal(formatMoney(-25050), '-₹250.50');
});

test('formatPlain and formatMoney refuse values that are not whole paise', () => {
  assert.throws(() => formatPlain(1.5), TypeError);
  assert.throws(() => formatMoney('100'), TypeError);
  assert.throws(() => formatMoney(undefined), TypeError);
});
