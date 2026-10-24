/** Category management: lists by kind, an archived list, and buttons to add or edit. */

import { el } from '../../ui/dom.js';
import { button } from '../../ui/button.js';
import { listRow } from '../../ui/listRow.js';
import { openCategorySheet } from '../../ui/categorySheet.js';
import { groupCategories, describeUses } from '../../core/categoryGroups.js';

function categoryRow({ category, uses }) {
  return listRow({
    icon: category.icon,
    color: category.color,
    title: category.name,
    subtitle: describeUses(uses),
    amount: '',
    ariaLabel: `Edit ${category.name}`,
    onClick: () => openCategorySheet({ category }),
  });
}

function group({ title, rows, kind }) {
  const list = rows.length > 0
    ? el('div', { className: 'list-card' }, ...rows.map(categoryRow))
    : el('p', { className: 'muted', text: `No ${title.toLowerCase()} categories.` });
  const add = kind && button({
    label: `New ${kind} category`,
    icon: 'plus',
    variant: 'secondary',
    block: true,
    onClick: () => openCategorySheet({ kind, onCreated: () => {} }),
  });
  return el('section', { className: 'stack' }, el('h3', { className: 'settings-group-title', text: title }), list, add);
}

/**
 * Build the categories part of Settings.
 * @param {{categories: object[], transactions: object[]}} state
 * @returns {HTMLElement}
 */
export function categoriesSection({ categories, transactions }) {
  const groups = groupCategories(categories, transactions);
  return el(
    'section',
    { className: 'stack' },
    el('h2', { className: 'settings-title', text: 'Categories' }),
    group({ title: 'Expense', rows: groups.expense, kind: 'expense' }),
    group({ title: 'Income', rows: groups.income, kind: 'income' }),
    groups.archived.length > 0 && group({ title: 'Archived', rows: groups.archived, kind: null }),
  );
}
