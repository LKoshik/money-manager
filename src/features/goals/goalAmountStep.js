/** The number pad step of the goal sheet: add money to the goal, or withdraw some. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { errorBox } from '../../ui/formField.js';
import { amountField } from '../../ui/amountField.js';
import { showToast } from '../../ui/toast.js';
import { addContribution } from '../../state/actions.js';
import { checkNewContribution } from '../../core/contributionRules.js';
import { checkAssign } from '../../core/stackModel.js';
import { hasAmount } from '../../core/transactionDraft.js';
import { textToPaise } from '../../core/amountInput.js';
import { formatMoney } from '../../core/money.js';

async function submit(session, input, { contributions, available }, confirm, errors) {
  // Friendly messages before saving. Adding money draws from the planner's available amount (when a plan exists).
  const problems = [...(input.type === 'add' ? checkAssign(available, input.amount) : []), ...checkNewContribution(contributions, input)];
  if (problems.length > 0) return errors.show(problems);
  confirm.disabled = true;
  try {
    const { reached } = await addContribution(input);
    session.step = 'main';
    session.redraw();
    if (reached) showToast('Goal reached');
  } catch (error) {
    console.error(error);
    confirm.disabled = false;
    errors.show(['Could not save. Please try again.']);
  }
}

/**
 * @param {{step: 'add'|'withdraw', goalId: string, redraw: Function}} session
 * @param {{saved: number, remaining: number}} row  This goal's row.
 * @param {object[]} contributions  This goal's contributions (for the withdraw check).
 * @param {number|null} [available=null]  Planner money available to assign (paise); null = no plan, no limit.
 * @returns {HTMLElement}
 *   The Back button goes to session.backStep (default "main").
 */
export function buildGoalAmountStep(session, row, contributions, available = null) {
  const type = session.step;
  const errors = errorBox();
  let text = '';
  const confirm = button({
    label: type === 'add' ? 'Add to goal' : 'Withdraw',
    block: true,
    disabled: true,
    onClick: () => submit(session, { goalId: session.goalId, type, amount: textToPaise(text) }, { contributions, available }, confirm, errors),
  });
  const field = amountField({
    text,
    type: type === 'add' ? 'income' : 'expense',
    onChange(next) {
      text = next;
      errors.clear();
      confirm.disabled = !hasAmount(next);
    },
  });
  const back = button({ label: 'Back', variant: 'secondary', block: true, onClick: () => { session.step = session.backStep ?? 'main'; session.redraw(); } });
  const hint = type === 'add' ? `${formatMoney(row.remaining)} to go${available === null ? '' : ` · ${formatMoney(Math.max(0, available))} available`}` : `Set aside now: ${formatMoney(row.saved)}`;
  return el('div', { className: 'stack' }, el('p', { className: 'muted goal-hint', text: hint }), field, errors.element, confirm, back);
}
