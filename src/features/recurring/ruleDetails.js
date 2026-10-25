/** The part of the recurring sheet that replaces "Date and note": name, repeat, start and end day. */

import { el } from '../../ui/dom.js';
import { segmented } from '../../ui/segmented.js';
import { textField } from '../../ui/formField.js';
import { FREQUENCY_LABELS } from '../../core/recurrenceStatus.js';
import { pastTransactionsText } from '../../core/recurringDraft.js';

const FREQUENCY_OPTIONS = Object.entries(FREQUENCY_LABELS).map(([id, label]) => ({ id, label }));
const EDIT_HINT = 'Changing the start day or repeat adds nothing from the past.';

/**
 * Build the block. Typing never redraws the sheet (that would close the keyboard).
 * @param {{draft: object, editing: boolean}} session
 * @param {(patch: object) => void} onChange  Gets the fields that changed.
 * @returns {HTMLElement}
 */
export function ruleDetails(session, onChange) {
  const hint = el('p', { className: 'muted rule-hint' });
  const refreshHint = () => {
    hint.textContent = session.editing ? EDIT_HINT : pastTransactionsText(session.draft);
  };
  const change = (patch) => {
    onChange(patch);
    refreshHint();
  };
  const note = textField({
    label: 'Name or note (optional)',
    value: session.draft.note,
    attrs: { maxlength: '100', placeholder: 'e.g. House rent', autocomplete: 'off' },
    onInput: (value) => change({ note: value }),
  });
  const repeat = segmented({
    options: FREQUENCY_OPTIONS,
    value: session.draft.frequency,
    ariaLabel: 'Repeat',
    onChange: (frequency) => change({ frequency }),
  });
  const start = textField({ label: 'Starts on', value: session.draft.startDay, attrs: { type: 'date' }, onInput: (startDay) => change({ startDay }) });
  const end = textField({ label: 'Ends on (optional)', value: session.draft.endDay, attrs: { type: 'date' }, onInput: (endDay) => change({ endDay }) });
  refreshHint();
  return el('div', { className: 'stack' }, note.element, el('span', { className: 'field-label', text: 'Repeat' }), repeat, start.element, hint, end.element);
}
