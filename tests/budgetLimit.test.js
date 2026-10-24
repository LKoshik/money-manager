import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitTextToPaise } from '../src/core/budgetLimit.js';

test('a normal amount becomes paise', () => {
  assert.deepEqual(limitTextToPaise('5000'), { paise: 500000, problem: null });
  assert.deepEqual(limitTextToPaise('12.5'), { paise: 1250, problem: null });
  assert.deepEqual(limitTextToPaise('12.'), { paise: 1200, problem: null }); // half-typed dot is fine
});

test('empty text asks for an amount', () => {
  const result = limitTextToPaise('');
  assert.equal(result.paise, null);
  assert.match(result.problem, /Type/);
});

test('zero is not a limit', () => {
  for (const text of ['0', '0.', '0.00']) {
    const result = limitTextToPaise(text);
    assert.equal(result.paise, null, text);
    assert.match(result.problem, /more than zero/);
  }
});
