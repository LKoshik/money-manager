import { el } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { button } from '../../ui/button.js';
import { emptyState } from '../../ui/emptyState.js';
import { totalCard } from '../../ui/totalCard.js';
import { openAccountSheet } from '../../ui/accountSheet.js';
import { buildAccountsModel } from './logic.js';
import { accountRow } from './accountRow.js';

// Remembered while the app is open, so a redraw does not close the section.
let archivedOpen = false;

const rows = (items) =>
  items.map(({ account, balance }) => accountRow({ account, balance, onClick: () => openAccountSheet({ account }) }));

function archivedSection(archived) {
  if (archived.length === 0) return null;
  const list = el('div', { className: 'list-card' }, ...rows(archived));
  list.hidden = !archivedOpen;
  const toggle = el(
    'button',
    {
      className: 'archived-toggle',
      attrs: { type: 'button', 'aria-expanded': String(archivedOpen) },
      on: {
        click: () => {
          archivedOpen = !archivedOpen;
          list.hidden = !archivedOpen;
          toggle.setAttribute('aria-expanded', String(archivedOpen));
        },
      },
    },
    el('span', { text: `Archived (${archived.length})` }),
    icon('chevron', 20),
  );
  return el('section', { className: 'stack' }, toggle, list);
}

/**
 * Build the Accounts screen.
 * @param {{accounts: object[], transactions: object[]}} state
 * @returns {HTMLElement}
 */
export function buildView(state) {
  if (state.accounts.length === 0) {
    return emptyState({
      icon: 'wallet',
      title: 'No accounts yet',
      message: 'Add Cash, a bank account, a UPI wallet or a credit card to get started.',
      action: { label: 'Create account', icon: 'plus', onClick: () => openAccountSheet() },
    });
  }
  const model = buildAccountsModel(state);
  const active = model.active.length > 0
    ? el('div', { className: 'list-card' }, ...rows(model.active))
    : el('p', { className: 'muted', text: 'All your accounts are archived. Add a new one to continue.' });
  return el(
    'div',
    { className: 'stack' },
    totalCard({ total: model.total, note: 'Active accounts only' }),
    active,
    button({ label: 'Add account', icon: 'plus', variant: 'secondary', block: true, onClick: () => openAccountSheet() }),
    archivedSection(model.archived),
  );
}
