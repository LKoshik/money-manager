/** Stop the plan and cancel a waiting change: each asks, saves, and tells the person. */

import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { stopPlan, cancelPlanChange } from '../../state/actions.js';
import { formatMonthLabel } from '../../core/dateLabels.js';

const failed = (error) => {
  console.error(error);
  showToast('Something went wrong. Please try again.', { kind: 'error' });
};

/**
 * Ask, then end the plan from next month. This month and the past months keep their numbers.
 * @param {string} nextMonth  Example: "2026-11"
 */
export async function stopThePlan(nextMonth) {
  const label = formatMonthLabel(nextMonth, true);
  const sure = await confirmDialog({
    title: 'Stop the plan?',
    message: `The plan ends from ${label}. This month and the months before keep their numbers.`,
    confirmLabel: 'Stop plan',
    danger: true,
  });
  if (!sure) return;
  try {
    await stopPlan();
    showToast(`Plan stops from ${label}`);
  } catch (error) {
    failed(error);
  }
}

/** Ask, then cancel the change that has not started yet. The current plan stays as it is. */
export async function cancelTheChange() {
  const sure = await confirmDialog({
    title: 'Cancel the change?',
    message: 'The waiting change is removed. Your current plan stays as it is.',
    confirmLabel: 'Cancel change',
    danger: true,
  });
  if (!sure) return;
  try {
    await cancelPlanChange();
    showToast('Change cancelled');
  } catch (error) {
    failed(error);
  }
}
