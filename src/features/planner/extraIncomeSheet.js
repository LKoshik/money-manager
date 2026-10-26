/**
 * The "Add extra income" sheet: a name, then either new money (creates the income transaction) or an
 * income already recorded (linked), then the split. Bucket amounts are typed, the wishes part is what is
 * left, so the split always equals the full amount. Typing never redraws the sheet (the keyboard would close).
 */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { segmented } from '../../ui/segmented.js';
import { textField, errorBox } from '../../ui/formField.js';
import { openBottomSheet } from '../../ui/bottomSheet.js';
import { showToast } from '../../ui/toast.js';
import { store } from '../../state/store.js';
import { addExtraIncome, linkExtraIncome } from '../../state/actions.js';
import { MAX_NAME_LENGTH } from '../../core/validate.js';
import { formatMoney } from '../../core/money.js';
import { pickDefaultAccount, selectableCategories } from '../../core/transactionDraft.js';
import { createExtraDraft, extraDraftToInput, draftSplit } from '../../core/extraIncomeDraft.js';
import { newIncomeFields, linkFields } from './extraIncomeFields.js';
import { amountInput } from './amountBox.js';

const MODES = [{ id: 'new', label: 'New money' }, { id: 'link', label: 'Already recorded' }];

function splitSection(draft, state, errors) {
  const live = el('p', { className: 'plan-live' });
  const update = () => {
    const split = draftSplit(draft, state.transactions);
    live.textContent = split.overBy > 0 ? `Buckets are ${formatMoney(split.overBy)} more than the amount` : `To your wishes: ${formatMoney(split.wishes)}`;
    live.classList.toggle('plan-live--over', split.overBy > 0);
    errors.clear();
  };
  const rows = draft.rows.map((row) =>
    el('div', { className: 'plan-row' }, el('span', { className: 'plan-name', text: row.name }), amountInput(row.amountText, `${row.name} amount`, (text) => { row.amountText = text; update(); })),
  );
  const hint = rows.length === 0 ? 'All of it goes to your wishes.' : 'Type what goes to a bucket. The rest goes to your wishes.';
  return { update, element: el('div', { className: 'stack' }, el('h3', { className: 'form-section-title', text: 'Split' }), el('p', { className: 'muted plan-hint', text: hint }), ...rows, live) };
}

async function submit(session, saveButton, errors) {
  const { draft, state } = session;
  const { input, problems } = extraDraftToInput(draft, state.transactions);
  if (problems.length > 0) return errors.show(problems);
  saveButton.disabled = true;
  try {
    await (draft.mode === 'new' ? addExtraIncome(input) : linkExtraIncome(input));
    await session.sheet.close();
    showToast('Extra income saved');
  } catch (error) {
    console.error(error);
    saveButton.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

function buildForm(session) {
  const { draft, state } = session;
  const errors = errorBox();
  const split = splitSection(draft, state, errors);
  const block = el('div', { className: 'stack' });
  const drawBlock = () =>
    block.replaceChildren(
      draft.mode === 'new'
        ? newIncomeFields({ draft, accounts: state.accounts, categories: state.categories, onChange: split.update })
        : linkFields({ draft, transactions: state.transactions, extraIncomes: state.extraIncomes, onChange: split.update, redraw: drawBlock }),
    );
  const name = textField({ label: 'Name', value: draft.name, attrs: { maxlength: String(MAX_NAME_LENGTH), placeholder: 'e.g. Birthday gift', autocomplete: 'off' }, onInput: (value) => { draft.name = value; errors.clear(); } });
  const mode = segmented({ options: MODES, value: draft.mode, ariaLabel: 'Where the money is', onChange(id) { draft.mode = id; drawBlock(); split.update(); } });
  const save = button({ label: 'Save', block: true, onClick: () => submit(session, save, errors) });
  drawBlock();
  split.update();
  return el('div', { className: 'stack' }, name.element, mode, block, split.element, errors.element, save);
}

/**
 * Open the extra income sheet.
 * @param {{buckets: Array<{id: string, name: string}>, now?: Date}} options  buckets = the buckets of the plan running now (the split rows).
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openExtraIncomeSheet({ buckets, now = new Date() }) {
  const state = store.getState();
  const draft = createExtraDraft(buckets, now);
  draft.accountId = pickDefaultAccount(state.accounts, state.settings.lastAccountId);
  draft.categoryId = selectableCategories(state.categories, 'income').find((category) => category.name === 'Other income')?.id ?? selectableCategories(state.categories, 'income')[0]?.id ?? null;
  const session = { draft, state, sheet: null };
  session.sheet = openBottomSheet({ title: 'Extra income', content: buildForm(session) });
  return session.sheet;
}
