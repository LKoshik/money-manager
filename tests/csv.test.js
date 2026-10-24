import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv, escapeCell } from '../src/core/csv.js';
import { makeAccount, makeCategory, makeTxn, localIso } from './helpers.js';

const accounts = [makeAccount({ id: 'cash', name: 'Cash' }), makeAccount({ id: 'bank', name: 'Bank' })];
const categories = [makeCategory({ id: 'food', name: 'Food' })];

test('escapeCell: plain text stays plain', () => {
  assert.equal(escapeCell('hello'), 'hello');
  assert.equal(escapeCell(250.5), '250.5');
  assert.equal(escapeCell(null), '');
});

test('escapeCell: commas, quotes and new lines are wrapped in quotes', () => {
  assert.equal(escapeCell('a,b'), '"a,b"');
  assert.equal(escapeCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCell('line1\nline2'), '"line1\nline2"');
});

test('escapeCell: formula starts are made harmless', () => {
  for (const text of ['=1+1', '+5', '-5', '@SUM(A1)']) {
    assert.equal(escapeCell(text), `'${text}`, text);
  }
});

test('buildCsv: header, BOM, Windows line ends, oldest first', () => {
  const txns = [
    makeTxn({ amount: 25050, date: localIso(2026, 9, 20), note: 'lunch, with team', tags: ['work', 'food'] }),
    makeTxn({ amount: 100000, date: localIso(2026, 9, 5), type: 'income', categoryId: 'food', note: '' }),
  ];
  const lines = buildCsv(txns, accounts, categories).replace('\uFEFF', '').split('\r\n');
  assert.equal(lines[0], 'Date,Type,Amount,Account,To account,Category,Note,Tags');
  assert.equal(lines[1], '2026-10-05,income,1000.00,Cash,,Food,,');
  assert.equal(lines[2], '2026-10-20,expense,250.50,Cash,,Food,"lunch, with team",work; food');
  assert.equal(lines[3], ''); // the text ends with a line break
});

test('buildCsv: starts with a BOM', () => {
  assert.ok(buildCsv([], accounts, categories).startsWith('\uFEFF'));
});

test('buildCsv: a transfer shows both accounts and no category', () => {
  const transfer = makeTxn({ type: 'transfer', amount: 500000, accountId: 'cash', toAccountId: 'bank', categoryId: null });
  const row = buildCsv([transfer], accounts, categories).split('\r\n')[1];
  assert.equal(row, '2026-10-15,transfer,5000.00,Cash,Bank,,,');
});

test('buildCsv: a missing account or category becomes an empty cell, not a crash', () => {
  const row = buildCsv([makeTxn({ accountId: 'ghost', categoryId: 'ghost' })], accounts, categories).split('\r\n')[1];
  assert.equal(row, '2026-10-15,expense,100.00,,,,,');
});

test('buildCsv: no transactions gives only the header', () => {
  const lines = buildCsv([], accounts, categories).split('\r\n');
  assert.equal(lines.length, 2);
});
