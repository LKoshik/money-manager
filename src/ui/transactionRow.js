/** One transaction in a list. Used by the History screen (and by Home later). */

import { listRow } from './listRow.js';
import { formatMoney } from '../core/money.js';

const MINUS = '\u2212'; // a real minus sign, easier to see than a hyphen

function describe(txn, category, account, toAccount) {
  const accountName = account?.name ?? 'Unknown account';
  if (txn.type === 'transfer') {
    return { icon: '🔁', color: null, title: 'Transfer', subtitle: [txn.note, `${accountName} → ${toAccount?.name ?? 'Unknown account'}`] };
  }
  const name = category?.name ?? 'Unknown category';
  const subtitle = txn.note ? [name, accountName] : [accountName];
  return { icon: category?.icon ?? '❓', color: category?.color ?? null, title: txn.note || name, subtitle };
}

function describeAmount(txn) {
  const money = formatMoney(txn.amount);
  if (txn.type === 'income') return { text: `+${money}`, className: 'amount--income' };
  if (txn.type === 'expense') return { text: `${MINUS}${money}`, className: 'amount--expense' };
  return { text: money, className: '' };
}

/**
 * Make a transaction row.
 * @param {{txn: object, category?: object, account?: object, toAccount?: object,
 *   onClick?: () => void}} config  Missing lookups show "Unknown" instead of breaking.
 * @returns {HTMLButtonElement}
 */
export function transactionRow({ txn, category, account, toAccount, onClick }) {
  const info = describe(txn, category, account, toAccount);
  const amount = describeAmount(txn);
  return listRow({
    icon: info.icon,
    color: info.color,
    title: info.title,
    subtitle: info.subtitle.filter(Boolean).join(' · '),
    amount: amount.text,
    amountClass: amount.className,
    onClick,
  });
}
