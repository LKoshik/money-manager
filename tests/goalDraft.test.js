import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGoalDraft, goalDraftToInput } from '../src/core/goalDraft.js';
import { toDayKey } from '../src/core/dates.js';
import { validateGoal } from '../src/core/validateGoals.js';
import { makeGoal, localIso } from './helpers.js';

test('a new draft is empty with a default icon and color', () => {
  const draft = createGoalDraft();
  assert.deepEqual([draft.name, draft.amountText, draft.deadlineDay], ['', '', '']);
  assert.ok(draft.icon && draft.color);
});

test('an edit draft shows the goal (target as typed text, deadline as a day)', () => {
  const draft = createGoalDraft(makeGoal({ targetAmount: 2505000, deadline: localIso(2026, 11, 31) }));
  assert.equal(draft.amountText, '25050');
  assert.equal(draft.deadlineDay, '2026-12-31');
});

test('goalDraftToInput: a good draft becomes a valid goal input (deadline at local 12:00)', () => {
  const { input, problems } = goalDraftToInput({ name: '  New phone ', icon: '📱', color: '#3b82f6', amountText: '25000.5', deadlineDay: '2026-12-31' });
  assert.deepEqual(problems, []);
  assert.equal(input.name, 'New phone');
  assert.equal(input.targetAmount, 2500050);
  assert.equal(toDayKey(input.deadline), '2026-12-31');
  assert.equal(new Date(input.deadline).getHours(), 12);
  const full = { id: 'x', createdAt: localIso(2026, 9, 1), completedAt: null, archived: false, ...input };
  assert.deepEqual(validateGoal(full), []);
});

test('goalDraftToInput: no deadline is null; problems are listed in words', () => {
  assert.equal(goalDraftToInput({ name: 'A', icon: 'i', color: 'c', amountText: '5', deadlineDay: '' }).input.deadline, null);
  assert.equal(goalDraftToInput({ name: '', icon: 'i', color: 'c', amountText: '5', deadlineDay: '' }).problems.length, 1);
  assert.equal(goalDraftToInput({ name: 'A', icon: 'i', color: 'c', amountText: '', deadlineDay: '' }).problems.length, 1);
  assert.equal(goalDraftToInput({ name: 'A', icon: 'i', color: 'c', amountText: '0', deadlineDay: '' }).problems.length, 1);
  assert.equal(goalDraftToInput({ name: 'A', icon: 'i', color: 'c', amountText: '5', deadlineDay: '2026-02-31' }).problems.length, 1);
  assert.equal(goalDraftToInput({ name: 'x'.repeat(41), icon: 'i', color: 'c', amountText: '5', deadlineDay: '' }).problems.length, 1);
});
