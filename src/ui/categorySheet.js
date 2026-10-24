/** A small sheet to create or edit a category (name, icon, color). Editing can also archive or restore it. */

import { el } from './dom.js';
import { button } from './button.js';
import { choiceGrid } from './choiceGrid.js';
import { textField, errorBox } from './formField.js';
import { openBottomSheet } from './bottomSheet.js';
import { showToast } from './toast.js';
import { addCategory, updateCategory } from '../state/actions.js';
import { MAX_NAME_LENGTH } from '../core/validate.js';
import {
  createCategoryDraft, categoryToDraft, buildCategoryInput, getIconChoices, getColorChoices,
} from '../core/categoryPresets.js';

function failed(session, saveButton) {
  return (error) => {
    console.error(error);
    if (saveButton) saveButton.disabled = false;
    showToast('Could not save the category. Please try again.', { kind: 'error' });
    session.busy = false;
  };
}

async function save(session, saveButton) {
  const { input, problems } = buildCategoryInput(session.draft);
  if (problems.length > 0) return session.errors.show(problems);
  saveButton.disabled = true;
  try {
    // The kind never changes on edit: old transactions of that kind would stop making sense.
    const { category } = session;
    const saved = category
      ? await updateCategory(category.id, { name: input.name, icon: input.icon, color: input.color })
      : await addCategory(input);
    await session.sheet.close();
    session.onDone(saved);
  } catch (error) {
    failed(session, saveButton)(error);
  }
}

async function toggleArchive(session, archiveButton) {
  const { category } = session;
  archiveButton.disabled = true;
  try {
    const saved = await updateCategory(category.id, { archived: !category.archived });
    await session.sheet.close();
    showToast(category.archived ? `${category.name} is back.` : `${category.name} archived. Restore it from Settings.`);
    session.onDone(saved);
  } catch (error) {
    failed(session, archiveButton)(error);
  }
}

function buildForm(session) {
  const { draft, errors, category } = session;
  const name = textField({
    label: 'Name',
    value: draft.name,
    attrs: { maxlength: String(MAX_NAME_LENGTH), placeholder: 'e.g. Pets', autocomplete: 'off' },
    onInput(value) {
      draft.name = value;
      errors.clear();
    },
  });
  const icons = choiceGrid({
    items: getIconChoices(draft.icon).map((icon) => ({ id: icon, label: icon, icon })),
    selectedId: draft.icon,
    ariaLabel: 'Icon',
    columns: 5,
    compact: true,
    onSelect: (icon) => { draft.icon = icon; },
  });
  const colors = choiceGrid({
    items: getColorChoices(draft.color).map((color) => ({ id: color.id, label: color.name, icon: '', color: color.id })),
    selectedId: draft.color,
    ariaLabel: 'Color',
    columns: 5,
    compact: true,
    onSelect: (color) => { draft.color = color; },
  });
  const saveButton = button({ label: 'Save category', block: true, onClick: () => save(session, saveButton) });
  const archiveButton = category && button({
    label: category.archived ? 'Restore category' : 'Archive category',
    variant: 'secondary',
    block: true,
    onClick: () => toggleArchive(session, archiveButton),
  });
  const hint = category && !category.archived && el('p', { className: 'muted', text: 'Archived categories keep their history but disappear from the Add screen.' });
  return el('div', { className: 'stack' }, name.element, icons, colors, errors.element, saveButton, archiveButton, hint);
}

/**
 * Open the category sheet: new category, or edit when "category" is given.
 * @param {{kind?: 'income'|'expense', category?: object, onCreated?: (category: object) => void,
 *   onSaved?: (category: object) => void}} options
 *   New: pass kind and onCreated. Edit: pass category (and optionally onSaved).
 *   The callback runs after the sheet has closed, with the saved category (also after archive or restore).
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openCategorySheet({ kind, category = null, onCreated, onSaved }) {
  const draft = category ? categoryToDraft(category) : createCategoryDraft(kind);
  const onDone = onSaved ?? onCreated ?? (() => {});
  const session = { draft, category, errors: errorBox(), sheet: null, onDone };
  const title = category ? 'Edit category' : draft.kind === 'income' ? 'New income category' : 'New expense category';
  session.sheet = openBottomSheet({ title, content: buildForm(session) });
  return session.sheet;
}
