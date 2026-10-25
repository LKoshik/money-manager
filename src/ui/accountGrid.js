/** A grid of account tiles (icon + name) to pick one account. The transaction form and the loan sheets share it. */

import { choiceGrid } from './choiceGrid.js';
import { ACCOUNT_TYPE_INFO } from '../core/accountList.js';

/**
 * @param {{accounts: object[], selectedId: string|null, onSelect: (id: string) => void, ariaLabel: string}} config
 * @returns {HTMLElement}
 */
export function accountGrid({ accounts, selectedId, onSelect, ariaLabel }) {
  const items = accounts.map((account) => ({ id: account.id, label: account.name, icon: ACCOUNT_TYPE_INFO[account.type].emoji }));
  return choiceGrid({ items, selectedId, onSelect, ariaLabel, columns: 3 });
}
