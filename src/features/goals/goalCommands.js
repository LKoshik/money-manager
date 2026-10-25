/** Archive, delete goal, delete contribution: each asks (when needed), saves, and tells the person. */

import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { updateGoal, removeGoal, removeContribution } from '../../state/actions.js';
import { checkRemoval } from '../../core/contributionRules.js';
import { contributionTitle } from '../../core/goalText.js';

const failed = (error) => {
  console.error(error);
  showToast('Something went wrong. Please try again.', { kind: 'error' });
};

/**
 * Archive a goal, or bring it back. Closes the sheet.
 * @param {{id: string, name: string, archived: boolean}} goal
 * @param {{close: () => Promise<void>}} sheet
 */
export async function toggleArchive(goal, sheet) {
  try {
    await updateGoal(goal.id, { archived: !goal.archived });
    await sheet.close();
    showToast(goal.archived ? `${goal.name} is back.` : `${goal.name} archived.`);
  } catch (error) {
    failed(error);
  }
}

/**
 * Ask, then delete the goal and all its contributions. Closes the sheet.
 * @param {{id: string, name: string}} goal
 * @param {{close: () => Promise<void>}} sheet
 */
export async function deleteGoal(goal, sheet) {
  const sure = await confirmDialog({
    title: `Delete "${goal.name}"?`,
    message: 'The goal and its history are deleted. Your accounts and transactions are not changed.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeGoal(goal.id);
    await sheet.close();
    showToast('Goal deleted');
  } catch (error) {
    failed(error);
  }
}

/**
 * Delete one entry of the history (after a question). Refused when it would break the saved amount.
 * @param {object} item  The contribution.
 * @param {object[]} contributions  All contributions of the same goal.
 */
export async function deleteContribution(item, contributions) {
  const problems = checkRemoval(contributions, item.id);
  if (problems.length > 0) return showToast(problems[0], { kind: 'error' });
  const sure = await confirmDialog({ title: 'Delete this entry?', message: `${contributionTitle(item)} will be removed from the goal.`, confirmLabel: 'Delete', danger: true });
  if (!sure) return;
  try {
    const { reached } = await removeContribution(item.id);
    if (reached) showToast('Goal reached');
  } catch (error) {
    failed(error);
  }
}
