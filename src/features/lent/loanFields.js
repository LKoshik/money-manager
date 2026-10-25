/** Form pieces the New loan and Add repayment sheets share: sections, the amount step, account, date and note. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { amountField } from '../../ui/amountField.js';
import { accountGrid } from '../../ui/accountGrid.js';
import { textField } from '../../ui/formField.js';
import { store } from '../../state/store.js';
import { hasAmount, selectableAccounts } from '../../core/transactionDraft.js';

/** @param {string} title @param {HTMLElement} content @returns {HTMLElement} */
export const section = (title, content) =>
  el('div', { className: 'form-section' }, el('h3', { className: 'form-section-title', text: title }), content);

/**
 * Step 1: the amount on the number pad.
 * @param {{draft: {amountText: string}, type: 'income'|'expense', hint?: string, top?: HTMLElement,
 *   onNext: () => void}} config  type only colors the amount (green = money comes in).
 * @returns {HTMLElement}
 */
export function amountStep({ draft, type, hint, top, onNext }) {
  const next = button({ label: 'Next', block: true, disabled: !hasAmount(draft.amountText), onClick: onNext });
  const field = amountField({
    text: draft.amountText,
    type,
    onChange(text) {
      draft.amountText = text;
      next.disabled = !hasAmount(text);
    },
  });
  return el('div', { className: 'stack' }, top, hint && el('p', { className: 'muted lent-hint', text: hint }), field, next);
}

/**
 * The account tiles. Tapping a tile changes the draft and does NOT redraw.
 * @param {{accountId: string|null}} draft
 * @param {{clear: () => void}} errors
 * @param {string} label
 * @returns {HTMLElement}
 */
export function accountSection(draft, errors, label = 'Account') {
  const accounts = selectableAccounts(store.getState().accounts, [draft.accountId]);
  return section(label, accountGrid({ accounts, selectedId: draft.accountId, ariaLabel: label, onSelect(id) { draft.accountId = id; errors.clear(); } }));
}

/**
 * The date-and-time box.
 * @param {{dateLocal: string}} draft
 * @param {{clear: () => void}} errors
 * @returns {HTMLElement}
 */
export function dateField(draft, errors) {
  return textField({ label: 'Date and time', value: draft.dateLocal, attrs: { type: 'datetime-local' }, onInput(value) { draft.dateLocal = value; errors.clear(); } }).element;
}

/**
 * The optional note box.
 * @param {{note: string}} draft
 * @returns {HTMLElement}
 */
export function noteField(draft) {
  return textField({ label: 'Note (optional)', value: draft.note, attrs: { maxlength: '100', placeholder: 'e.g. For the trip', autocomplete: 'off' }, onInput(value) { draft.note = value; } }).element;
}
