import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../src/ui/theme.js';

test('a chosen theme always wins', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('no choice follows the phone', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
});
