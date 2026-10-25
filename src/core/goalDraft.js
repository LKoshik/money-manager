/** The form data of the goal sheet: a goal into a draft, and a draft into a goal. Pure. */

import { MAX_NAME_LENGTH } from './validate.js';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './categoryPresets.js';
import { paiseToText, textToPaise } from './amountInput.js';
import { fromLocalInputValue } from './dateInput.js';
import { toDayKey } from './dates.js';

/**
 * @param {object|null} [goal]  Give a goal to edit it; none for a new one.
 * @returns {{name: string, icon: string, color: string, amountText: string, deadlineDay: string}}
 *   deadlineDay is "YYYY-MM-DD", or "" for no deadline.
 */
export function createGoalDraft(goal = null) {
  if (!goal) return { name: '', icon: CATEGORY_ICONS[19], color: CATEGORY_COLORS[6].id, amountText: '', deadlineDay: '' };
  return {
    name: goal.name,
    icon: goal.icon,
    color: goal.color,
    amountText: paiseToText(goal.targetAmount),
    deadlineDay: goal.deadline ? toDayKey(goal.deadline) : '',
  };
}

/**
 * Check the draft and build the repository input.
 * @param {{name: string, icon: string, color: string, amountText: string, deadlineDay: string}} draft
 * @returns {{input: object, problems: string[]}} Save only when problems is empty.
 */
export function goalDraftToInput(draft) {
  const name = draft.name.trim();
  const targetAmount = textToPaise(draft.amountText);
  const problems = [];
  if (!name) problems.push('Give the goal a name.');
  else if (name.length > MAX_NAME_LENGTH) problems.push(`Use at most ${MAX_NAME_LENGTH} letters for the name.`);
  if (!targetAmount || targetAmount <= 0) problems.push('Set a target amount above zero.');
  // 12:00 local keeps the day stable in every time zone.
  const deadline = draft.deadlineDay ? fromLocalInputValue(`${draft.deadlineDay}T12:00`) : null;
  if (draft.deadlineDay && !deadline) problems.push('Check the deadline date.');
  return { input: { name, icon: draft.icon, color: draft.color, targetAmount, deadline }, problems };
}
