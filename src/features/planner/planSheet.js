/**
 * The Create / Edit plan sheet: monthly income, a list of buckets (name + amount), and the wishes allowance
 * calculated live. Typing never redraws the sheet (that would close the keyboard): only the numbers line changes.
 */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { icon } from '../../ui/icons.js';
import { textField, errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { showToast } from '../../ui/toast.js';
import { savePlan } from '../../state/actions.js';
import { MAX_NAME_LENGTH } from '../../core/validate.js';
import { MAX_BUCKETS } from '../../core/validatePlans.js';
import { sanitizeAmount } from '../../core/amountInput.js';
import { amountInput } from './amountBox.js';
import { formatMoney } from '../../core/money.js';
import { formatMonthLabel } from '../../core/dateLabels.js';
import { createPlanDraft, planDraftToInput, draftTotals } from '../../core/planDraft.js';
import { saveTarget } from '../../core/planChanges.js';

/** The text under the numbers: green allowance, or a warning. */
function totalsText(draft) {
  const totals = draftTotals(draft);
  if (totals.overBy > 0) return { text: `Buckets are ${formatMoney(totals.overBy)} more than your income`, over: true };
  return { text: `Wishes allowance: ${formatMoney(totals.allowance)}`, over: false };
}

function bucketRow(row, onChange, onRemove) {
  const name = el('input', {
    className: 'field-input plan-name',
    attrs: { type: 'text', value: row.name, maxlength: String(MAX_NAME_LENGTH), placeholder: 'Bucket name', autocomplete: 'off', 'aria-label': 'Bucket name' },
    on: { input() { row.name = name.value; onChange(); } },
  });
  const amount = amountInput(row.amountText, `${row.name || 'Bucket'} amount`, (text) => { row.amountText = text; onChange(); });
  const remove = el('button', { className: 'icon-btn', attrs: { type: 'button', 'aria-label': 'Remove bucket' }, on: { click: onRemove } }, icon('close', 20));
  return el('div', { className: 'plan-row' }, name, amount, remove);
}

function buildForm(session) {
  const { draft } = session;
  const errors = errorBox();
  const summary = el('p', { className: 'plan-live' });
  const rows = el('div', { className: 'stack plan-rows' });
  const refresh = () => {
    const { text, over } = totalsText(draft);
    summary.textContent = text;
    summary.classList.toggle('plan-live--over', over);
    errors.clear();
  };
  const drawRows = () => {
    rows.replaceChildren(
      ...draft.rows.map((row) =>
        bucketRow(row, refresh, () => {
          draft.rows = draft.rows.filter((item) => item !== row);
          drawRows();
          refresh();
        }),
      ),
    );
    add.hidden = draft.rows.length >= MAX_BUCKETS;
  };
  const income = textField({ label: 'Monthly income', value: draft.incomeText, attrs: { inputmode: 'decimal', placeholder: '0', autocomplete: 'off' }, onInput(value) {
    draft.incomeText = sanitizeAmount(value);
    if (draft.incomeText !== value) income.input.value = draft.incomeText;
    refresh();
  } });
  const add = button({ label: 'Add bucket', icon: 'plus', variant: 'secondary', block: true, onClick() {
    draft.rows.push({ id: crypto.randomUUID(), name: '', amountText: '' });
    drawRows();
  } });
  const save = button({ label: 'Save plan', block: true, onClick: () => submit(session, save, errors) });
  const hint = el('p', { className: 'muted plan-hint', text: session.startNote });
  drawRows();
  refresh();
  return el('div', { className: 'stack' }, income.element, el('h3', { className: 'form-section-title', text: 'Buckets' }), rows, add, summary, hint, errors.element, save);
}

async function submit(session, saveButton, errors) {
  const { input, problems } = planDraftToInput(session.draft);
  if (problems.length > 0) return errors.show(problems);
  saveButton.disabled = true;
  try {
    const plan = await savePlan(input);
    await session.sheet.close();
    showToast(`Plan saved. It applies from ${formatMonthLabel(plan.appliesFrom, true)}`);
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

/**
 * Open the plan sheet.
 * @param {{plans: object[], plan?: object|null, now?: Date}} options
 *   plans = all versions (decides when the change starts). plan = the version to start from (the waiting change, else the current plan); none = a new plan.
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openPlanSheet({ plans, plan = null, now = new Date() }) {
  const { appliesFrom } = saveTarget(plans, now);
  const first = plans.length === 0;
  const session = {
    draft: createPlanDraft(plan),
    sheet: null,
    startNote: first ? 'Your plan starts this month and repeats every month until you change it.' : `Changes start from ${formatMonthLabel(appliesFrom, true)}. This month stays as it is.`,
  };
  const content = buildForm(session);
  session.sheet = openBottomSheet({ title: first ? 'Create plan' : 'Edit plan', content });
  return session.sheet;
}
