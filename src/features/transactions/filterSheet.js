/** The filter sheet: date, type, category and account. Nothing changes until "Apply". */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { segmented } from '../../ui/segmented.js';
import { choiceGrid } from '../../ui/choiceGrid.js';
import { textField, errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { customRangeProblem } from '../../core/datePresets.js';
import { EMPTY_FILTERS } from '../../core/transactionFilter.js';

const DATE_OPTIONS = [
  { id: 'all', label: 'All time' },
  { id: 'thisMonth', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'custom', label: 'Custom' },
];
const TYPE_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
];

const section = (title, content) =>
  el('div', { className: 'form-section' }, el('h3', { className: 'form-section-title', text: title }), content);

function customRange(draft, errors) {
  const field = (label, key) =>
    textField({ label, value: draft[key], attrs: { type: 'date' }, onInput(value) { draft[key] = value; errors.clear(); } }).element;
  const box = el('div', { className: 'stack' }, field('From', 'from'), field('To', 'to'));
  box.hidden = draft.datePreset !== 'custom';
  return box;
}

function dateSection(draft, errors) {
  const range = customRange(draft, errors);
  const choose = (datePreset) => {
    draft.datePreset = datePreset;
    range.hidden = datePreset !== 'custom';
  };
  const options = segmented({ options: DATE_OPTIONS, value: draft.datePreset, ariaLabel: 'Date', onChange: choose });
  return section('Date', el('div', { className: 'stack' }, options, range));
}

/** A grid with an "All" tile first. An empty id means "no filter". */
function pickerSection({ title, items, selectedId, onSelect }) {
  const withAll = [{ id: '', label: 'All', icon: '🔎' }, ...items];
  return section(title, choiceGrid({ items: withAll, selectedId: selectedId ?? '', ariaLabel: title, onSelect: (id) => onSelect(id || null) }));
}

const archivedNote = (item) => (item.archived ? `${item.name} (archived)` : item.name);

/**
 * Open the filter sheet.
 * @param {{filters: object, state: {categories: object[], accounts: object[]}, onApply: (filters: object) => void}} config
 *   onApply gets the new filters (the search text is kept as it was).
 * @returns {{close: Function, element: HTMLElement}}
 */
export function openFilterSheet({ filters, state, onApply }) {
  const draft = { ...filters };
  const errors = errorBox();
  let sheet;
  const apply = () => {
    if (draft.datePreset === 'custom') {
      const problem = customRangeProblem(draft.from, draft.to);
      if (problem) return errors.show([problem]);
    }
    onApply(draft);
    sheet.close();
  };
  const reset = () => {
    onApply({ ...EMPTY_FILTERS, query: filters.query });
    sheet.close();
  };
  const content = el(
    'div',
    { className: 'stack' },
    dateSection(draft, errors),
    section('Type', segmented({ options: TYPE_OPTIONS, value: draft.type ?? 'all', ariaLabel: 'Type', onChange: (id) => { draft.type = id === 'all' ? null : id; } })),
    pickerSection({
      title: 'Category',
      items: state.categories.map((c) => ({ id: c.id, label: archivedNote(c), icon: c.icon, color: c.color })),
      selectedId: draft.categoryId,
      onSelect: (id) => { draft.categoryId = id; },
    }),
    pickerSection({
      title: 'Account',
      items: state.accounts.map((a) => ({ id: a.id, label: archivedNote(a), icon: '👛' })),
      selectedId: draft.accountId,
      onSelect: (id) => { draft.accountId = id; },
    }),
    errors.element,
    button({ label: 'Apply', block: true, onClick: apply }),
    button({ label: 'Reset filters', variant: 'secondary', block: true, onClick: reset }),
  );
  sheet = openBottomSheet({ title: 'Filter', content });
  return sheet;
}
