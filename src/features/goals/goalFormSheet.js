/**
 * The New / Edit goal sheet. Step "amount" = target on the number pad; step "details" = name,
 * icon, color, deadline. Typing never redraws the sheet (that would close the keyboard).
 */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { choiceGrid } from '../../ui/choiceGrid.js';
import { amountField } from '../../ui/amountField.js';
import { textField, errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { showToast } from '../../ui/toast.js';
import { addGoal, updateGoal } from '../../state/actions.js';
import { MAX_NAME_LENGTH } from '../../core/validate.js';
import { getIconChoices, getColorChoices } from '../../core/categoryPresets.js';
import { createGoalDraft, goalDraftToInput } from '../../core/goalDraft.js';
import { hasAmount } from '../../core/transactionDraft.js';
import { formatAmountText } from '../../core/amountInput.js';

async function save(session, saveButton, errors) {
  const { input, problems } = goalDraftToInput(session.draft);
  if (problems.length > 0) return errors.show(problems);
  saveButton.disabled = true;
  try {
    if (session.goal) {
      const { reached } = await updateGoal(session.goal.id, input);
      await session.sheet.close();
      showToast(reached ? 'Goal reached' : 'Goal saved');
    } else {
      await addGoal(input);
      await session.sheet.close();
      showToast('Goal created');
    }
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

function buildAmount(session) {
  const { draft } = session;
  const done = button({ label: session.goal ? 'Done' : 'Next', block: true, disabled: !hasAmount(draft.amountText), onClick: () => { session.step = 'details'; session.redraw(); } });
  const field = amountField({
    text: draft.amountText,
    type: 'income',
    onChange(text) {
      draft.amountText = text;
      done.disabled = !hasAmount(text);
    },
  });
  return el('div', { className: 'stack' }, el('p', { className: 'muted goal-hint', text: 'How much do you want to save?' }), field, done);
}

function grid(label, items, selectedId, onSelect) {
  return choiceGrid({ items, selectedId, ariaLabel: label, columns: 5, compact: true, onSelect });
}

function buildDetails(session) {
  const { draft } = session;
  const errors = errorBox();
  const clear = (patch) => { Object.assign(draft, patch); errors.clear(); };
  const name = textField({ label: 'Name', value: draft.name, attrs: { maxlength: String(MAX_NAME_LENGTH), placeholder: 'e.g. New phone', autocomplete: 'off' }, onInput: (value) => clear({ name: value }) });
  const icons = grid('Icon', getIconChoices(draft.icon).map((icon) => ({ id: icon, label: icon, icon })), draft.icon, (icon) => { draft.icon = icon; });
  const colors = grid('Color', getColorChoices(draft.color).map((color) => ({ id: color.id, label: color.name, icon: '', color: color.id })), draft.color, (color) => { draft.color = color; });
  const target = button({ label: draft.amountText ? `Target: ₹${formatAmountText(draft.amountText)}` : 'Set target amount', variant: 'secondary', block: true, onClick: () => { session.step = 'amount'; session.redraw(); } });
  const deadline = textField({ label: 'Deadline (optional)', value: draft.deadlineDay, attrs: { type: 'date' }, onInput: (value) => clear({ deadlineDay: value }) });
  const saveButton = button({ label: session.goal ? 'Save goal' : 'Create goal', block: true, onClick: () => save(session, saveButton, errors) });
  const hint = el('p', { className: 'muted goal-hint', text: 'A deadline shows how much to set aside each month.' });
  return el('div', { className: 'stack' }, name.element, icons, colors, target, deadline.element, hint, errors.element, saveButton);
}

/**
 * Open the goal sheet.
 * @param {{goal?: object|null}} [options]  Give a goal to edit it.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openGoalFormSheet({ goal = null } = {}) {
  const root = el('div', { className: 'stack' });
  const session = {
    goal,
    draft: createGoalDraft(goal),
    step: goal ? 'details' : 'amount',
    sheet: null,
    redraw: () => root.replaceChildren(session.step === 'amount' ? buildAmount(session) : buildDetails(session)),
  };
  session.redraw();
  session.sheet = openBottomSheet({ title: goal ? 'Edit goal' : 'New goal', content: root });
  return session.sheet;
}
