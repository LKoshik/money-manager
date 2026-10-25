/** The main step of the goal sheet: header, progress, add/withdraw buttons, history, edit/archive/delete. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { icon } from '../../ui/icons.js';
import { goalBar } from './goalBar.js';
import { openGoalFormSheet } from './goalFormSheet.js';
import { toggleArchive, deleteGoal, deleteContribution } from './goalCommands.js';
import { progressText, paceText, contributionTitle } from '../../core/goalText.js';
import { toDayKey } from '../../core/dates.js';
import { formatDayLabel } from '../../core/dateLabels.js';

function historyRow(item, onDelete) {
  const del = el('button', { className: 'goal-contrib-delete', attrs: { type: 'button', 'aria-label': `Delete: ${contributionTitle(item)}` }, on: { click: onDelete } }, icon('close', 18));
  return el(
    'div',
    { className: 'goal-contrib' },
    el('span', { className: 'goal-contrib-main' }, el('span', { className: `goal-contrib-title goal-contrib-title--${item.type}`, text: contributionTitle(item) }), el('span', { className: 'goal-contrib-sub', text: formatDayLabel(toDayKey(item.date)) })),
    del,
  );
}

function historyBlock(contributions) {
  if (contributions.length === 0) return el('p', { className: 'muted goal-hint', text: 'Nothing set aside yet.' });
  const newestFirst = [...contributions].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return el('div', { className: 'list-card' }, ...newestFirst.map((item) => historyRow(item, () => deleteContribution(item, contributions))));
}

/**
 * @param {{step: string, redraw: Function, sheet: {close: Function}}} session
 * @param {object} row  This goal's row from buildGoalRows.
 * @param {object[]} contributions  This goal's contributions.
 * @returns {HTMLElement}
 */
export function buildGoalMain(session, row, contributions) {
  const { goal } = row;
  const go = (step) => () => {
    session.step = step;
    session.redraw();
  };
  const head = el(
    'div',
    { className: 'goal-head', attrs: { style: `--goal-color:${goal.color}` } },
    el('span', { className: 'goal-icon', text: goal.icon }),
    el('span', { className: 'goal-head-text' }, el('h2', { className: 'goal-card-name', text: goal.name }), el('span', { className: 'goal-progress', text: progressText(row) })),
  );
  const actions = !goal.archived && el('div', { className: 'goal-actions' }, button({ label: 'Add money', block: true, onClick: go('add') }), button({ label: 'Withdraw', variant: 'secondary', block: true, disabled: row.saved <= 0, onClick: go('withdraw') }));
  return el(
    'div',
    { className: 'stack' },
    head,
    goalBar(row, goal.name),
    el('span', { className: `goal-pace goal-pace--${row.status}`, text: paceText(row) }),
    actions,
    el('h3', { className: 'goal-summary-title', text: 'History' }),
    historyBlock(contributions),
    button({ label: 'Edit goal', variant: 'secondary', block: true, onClick: () => openGoalFormSheet({ goal }) }),
    button({ label: goal.archived ? 'Restore goal' : 'Archive goal', variant: 'secondary', block: true, onClick: () => toggleArchive(goal, session.sheet) }),
    button({ label: 'Delete goal', variant: 'danger', block: true, onClick: () => deleteGoal(goal, session.sheet) }),
  );
}
