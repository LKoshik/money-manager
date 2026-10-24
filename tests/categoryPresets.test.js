import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORY_ICONS, CATEGORY_COLORS, createCategoryDraft, buildCategoryInput,
  categoryToDraft, getIconChoices, getColorChoices,
} from '../src/core/categoryPresets.js';
import { validateCategory } from '../src/core/validate.js';

test('every preset icon and color makes a valid category', () => {
  for (const icon of CATEGORY_ICONS) {
    for (const color of CATEGORY_COLORS) {
      const { input, problems } = buildCategoryInput({ name: 'X', icon, color: color.id, kind: 'expense' });
      assert.deepEqual(problems, []);
      assert.deepEqual(validateCategory({ ...input, id: 'id', archived: false }), []);
    }
  }
});

test('the draft starts with the kind and the first presets', () => {
  const draft = createCategoryDraft('income');
  assert.equal(draft.kind, 'income');
  assert.equal(draft.icon, CATEGORY_ICONS[0]);
});

test('buildCategoryInput: name problems and trimming', () => {
  assert.deepEqual(buildCategoryInput({ ...createCategoryDraft('expense'), name: '  ' }).problems, ['Give the category a name.']);
  assert.match(buildCategoryInput({ ...createCategoryDraft('expense'), name: 'x'.repeat(41) }).problems[0], /at most 40/);
  assert.equal(buildCategoryInput({ ...createCategoryDraft('expense'), name: ' Pets ' }).input.name, 'Pets');
});

test('categoryToDraft copies the editable fields and the kind', () => {
  const draft = categoryToDraft({ id: 'x', name: 'Pets', icon: '🐶', color: '#ef4444', kind: 'income', archived: true });
  assert.deepEqual(draft, { name: 'Pets', icon: '🐶', color: '#ef4444', kind: 'income' });
});

test('getIconChoices / getColorChoices add the current value only when it is not a preset', () => {
  assert.equal(getIconChoices(CATEGORY_ICONS[3]), CATEGORY_ICONS);
  assert.deepEqual(getIconChoices('🏪').slice(-1), ['🏪']);
  assert.equal(getIconChoices('🏪').length, CATEGORY_ICONS.length + 1);
  assert.equal(getColorChoices('#ef4444'), CATEGORY_COLORS);
  const extra = getColorChoices('#84cc16');
  assert.equal(extra.length, CATEGORY_COLORS.length + 1);
  assert.equal(extra.at(-1).id, '#84cc16');
  assert.equal(getIconChoices(undefined), CATEGORY_ICONS);
});
