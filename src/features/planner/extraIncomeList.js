/** The "Extra income" section of the Planner screen: the entries, with their split, and the button to add one. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { confirmDialog } from '../../ui/modal.js';
import { showToast } from '../../ui/toast.js';
import { removeExtraIncome } from '../../state/actions.js';
import { openExtraIncomeSheet } from './extraIncomeSheet.js';
import { formatMoney } from '../../core/money.js';
import { formatDayLabel } from '../../core/dateLabels.js';
import { toDayKey } from '../../core/dates.js';

/** Ask, then delete the entry. The income transaction in your accounts stays. */
async function deleteEntry(entry) {
  const sure = await confirmDialog({
    title: `Delete "${entry.name}"?`,
    message: 'It stops adding to your wishes. The income transaction stays in your accounts.',
    confirmLabel: 'Delete',
    danger: true,
  });
  if (!sure) return;
  try {
    await removeExtraIncome(entry.id);
    showToast('Extra income deleted');
  } catch (error) {
    console.error(error);
    showToast('Something went wrong. Please try again.', { kind: 'error' });
  }
}

const splitText = (entry) => [`Wishes ${formatMoney(entry.wishes)}`, ...entry.buckets.map((bucket) => `${bucket.name} ${formatMoney(bucket.amount)}`)].join(' · ');

function entryCard(entry, now) {
  return el(
    'button',
    { className: 'plan-extra', attrs: { type: 'button', 'aria-label': `${entry.name}, ${formatMoney(entry.amount)}. Tap to delete.` }, on: { click: () => deleteEntry(entry) } },
    el('span', { className: 'plan-line' }, el('span', { className: 'plan-line-label', text: entry.name }), el('span', { className: 'plan-line-value', text: formatMoney(entry.amount) })),
    el('span', { className: 'muted plan-hint', text: `${formatDayLabel(toDayKey(entry.date), now)} · ${splitText(entry)}` }),
  );
}

/**
 * @param {object[]} extraIncomes  All entries.
 * @param {Array<{id: string, name: string}>} buckets  The buckets of the plan running now.
 * @param {Date} [now=new Date()]
 * @returns {HTMLElement}
 */
export function extraIncomeSection(extraIncomes, buckets, now = new Date()) {
  return el(
    'section',
    { className: 'stack' },
    el('h2', { className: 'plan-card-title', text: 'Extra income' }),
    extraIncomes.length === 0
      ? el('p', { className: 'muted plan-hint', text: 'A gift, a bonus or money from family. Part of it can go to your wishes.' })
      : el('div', { className: 'list-card' }, ...extraIncomes.map((entry) => entryCard(entry, now))),
    button({ label: 'Add extra income', icon: 'plus', variant: 'secondary', block: true, onClick: () => openExtraIncomeSheet({ buckets, now }) }),
  );
}
