/** One account in the list: type icon, name, type, and its calculated balance. */

import { listRow } from '../../ui/listRow.js';
import { ACCOUNT_TYPE_INFO } from '../../core/accountList.js';
import { formatMoney } from '../../core/money.js';

/**
 * @param {{account: object, balance: number, onClick: () => void}} config
 * @returns {HTMLButtonElement}
 */
export function accountRow({ account, balance, onClick }) {
  const info = ACCOUNT_TYPE_INFO[account.type];
  // A negative balance is shown in red; on a credit card it means "you owe".
  const owes = balance < 0 && account.type === 'credit';
  return listRow({
    icon: info.emoji,
    title: account.name,
    subtitle: owes ? `${info.label} · You owe` : info.label,
    amount: formatMoney(balance),
    amountClass: balance < 0 ? 'amount--expense' : '',
    onClick,
  });
}
