/** The Goals screen: a note, totals, goal cards, "New goal", and archived goals behind a toggle. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { emptyState } from '../../ui/emptyState.js';
import { goalCard } from './goalCard.js';
import { goalBar } from './goalBar.js';
import { openGoalSheet } from './goalSheet.js';
import { openGoalFormSheet } from './goalFormSheet.js';
import { buildGoalRows, sortGoalRows, goalTotals } from '../../core/goalList.js';
import { totalsText } from '../../core/goalText.js';

const NOTE = 'Goals are only tracked here. Money you add to a goal does not change your accounts or reports.';

function summaryCard(totals) {
  const label = `${totals.count} goal${totals.count === 1 ? '' : 's'}`;
  return el(
    'section',
    { className: 'card stack goal-summary' },
    el('div', { className: 'goal-card-top' }, el('h2', { className: 'goal-summary-title', text: 'All goals' }), el('span', { className: 'muted', text: label })),
    goalBar(totals, 'All goals'),
    el('span', { className: 'goal-progress', text: totalsText(totals) }),
  );
}

const cardsOf = (rows, now) => el('div', { className: 'list-card' }, ...rows.map((row) => goalCard(row, now, () => openGoalSheet(row.goal.id))));

function emptyBlock(hasArchived) {
  return emptyState({
    icon: 'flag',
    title: hasArchived ? 'No active goals' : 'No goals yet',
    message: 'Set a target, like a trip or a new phone, then add money to it as you save.',
    action: { label: 'New goal', icon: 'plus', onClick: () => openGoalFormSheet() },
  });
}

/**
 * Build the Goals screen.
 * @param {{goals: object[], contributions: object[]}} state
 * @param {{now?: Date, showArchived?: boolean, onToggleArchived?: () => void}} [options]
 * @returns {HTMLElement}
 */
export function buildView(state, { now = new Date(), showArchived = false, onToggleArchived = () => {} } = {}) {
  const rows = sortGoalRows(buildGoalRows(state.goals, state.contributions, now));
  const live = rows.filter((row) => !row.goal.archived);
  const archived = rows.filter((row) => row.goal.archived);
  const toggle =
    archived.length > 0 &&
    button({ label: showArchived ? 'Hide archived' : `Show archived (${archived.length})`, variant: 'secondary', block: true, onClick: onToggleArchived });
  return el(
    'div',
    { className: 'stack' },
    el('p', { className: 'muted goals-note', text: NOTE }),
    live.length === 0 ? emptyBlock(archived.length > 0) : [summaryCard(goalTotals(live)), cardsOf(live, now)],
    live.length > 0 && button({ label: 'New goal', icon: 'plus', variant: 'secondary', block: true, onClick: () => openGoalFormSheet() }),
    toggle,
    showArchived && archived.length > 0 && [el('h2', { className: 'goal-summary-title', text: 'Archived' }), cardsOf(archived, now)],
  );
}
