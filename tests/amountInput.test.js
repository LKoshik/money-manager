import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pressKey, sanitizeAmount, textToPaise, paiseToText, formatAmountText, MAX_WHOLE_DIGITS,
} from '../src/core/amountInput.js';

const type = (keys) => [...keys].reduce(pressKey, '');

test('pressKey: digits build the number, no leading zeros', () => {
  assert.equal(type('250'), '250');
  assert.equal(type('05'), '5');
  assert.equal(type('00'), '0');
});

test('pressKey: one dot, at most 2 decimals', () => {
  assert.equal(type('12.5'), '12.5');
  assert.equal(type('1.2.3'), '1.23');
  assert.equal(type('1.234'), '1.23');
  assert.equal(type('.5'), '0.5');
});

test('pressKey: backspace removes the last character and is safe on empty text', () => {
  assert.equal(pressKey('12.5', 'back'), '12.');
  assert.equal(pressKey('', 'back'), '');
});

test('pressKey: limits the whole part and ignores unknown keys', () => {
  const full = '9'.repeat(MAX_WHOLE_DIGITS);
  assert.equal(pressKey(full, '1'), full);
  assert.equal(pressKey(full, '.'), `${full}.`);
  assert.equal(pressKey('12', 'x'), '12');
});

test('sanitizeAmount: keeps only valid characters', () => {
  assert.equal(sanitizeAmount('Rs 1,25,000.456'), '125000.45');
  assert.equal(sanitizeAmount('abc'), '');
});

test('textToPaise: whole, decimal, half-typed and empty', () => {
  assert.equal(textToPaise('250'), 25000);
  assert.equal(textToPaise('250.5'), 25050);
  assert.equal(textToPaise('12.'), 1200);
  assert.equal(textToPaise('0.07'), 7);
  assert.equal(textToPaise(''), null);
});

test('paiseToText: shortest text and round trip', () => {
  assert.equal(paiseToText(25000), '250');
  assert.equal(paiseToText(25050), '250.5');
  assert.equal(paiseToText(7), '0.07');
  assert.equal(paiseToText(0), '0');
  assert.equal(paiseToText(10000), '100');
  assert.equal(paiseToText(-5000), '-50');
  for (const paise of [1, 10, 100, 12345, 99999999]) assert.equal(textToPaise(paiseToText(paise)), paise);
});

test('formatAmountText: Indian grouping and a half-typed dot', () => {
  assert.equal(formatAmountText(''), '0');
  assert.equal(formatAmountText('100000'), '1,00,000');
  assert.equal(formatAmountText('1250.5'), '1,250.5');
  assert.equal(formatAmountText('12.'), '12.');
  assert.equal(formatAmountText('0.'), '0.');
});
