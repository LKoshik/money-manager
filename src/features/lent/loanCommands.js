/** Delete a loan or a repayment: each asks first, saves, and tells the person. */

import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { removeLoan, removeRepayment } from '../../state/actions.js';
import { formatMoney } from '../../core/money.js';

const failed = (error) => {
  console.error(error);
  showToast('Something went wrong. Please try again.', { kind: 'error' });
};

/**
 * Ask, then delete the loan with all its repayments. Balances recalculate by themselves.
 * @param {{id: string, person: string}} loan
 * @param {number} repaymentCount
 */
export async function deleteLoan(loan, repaymentCount) {
  const extra = repaymentCount > 0 ? ` Its ${repaymentCount} repayment${repaymentCount === 1 ? '' : 's'} will be deleted too.` : '';
  const sure = await confirmDialog({
    title: 'Delete this loan?',
    message: `The loan with ${loan.person} is removed and your account balances are recalculated.${extra}`,
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeLoan(loan.id);
    showToast('Loan deleted');
  } catch (error) {
    failed(error);
  }
}

/**
 * Ask, then delete one repayment.
 * @param {{id: string, amount: number}} item
 */
export async function deleteRepayment(item) {
  const sure = await confirmDialog({
    title: 'Delete this repayment?',
    message: `${formatMoney(item.amount)} will be taken out of the repayments and your account balance is recalculated.`,
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeRepayment(item.id);
  } catch (error) {
    failed(error);
  }
}
