/** The icons and colors the person can pick for a new category, and its form logic. */

import { MAX_NAME_LENGTH } from './validate.js';

export const CATEGORY_ICONS = [
  '🍔', '☕', '🛒', '🚌', '⛽', '🛍️', '💡', '🏠', '💊', '🎬',
  '📚', '✈️', '🎁', '🐶', '💇', '📱', '🏋️', '🎮', '💼', '💰',
];

export const CATEGORY_COLORS = [
  { id: '#ef4444', name: 'Red' },
  { id: '#f97316', name: 'Orange' },
  { id: '#eab308', name: 'Yellow' },
  { id: '#22c55e', name: 'Green' },
  { id: '#14b8a6', name: 'Teal' },
  { id: '#06b6d4', name: 'Cyan' },
  { id: '#3b82f6', name: 'Blue' },
  { id: '#8b5cf6', name: 'Violet' },
  { id: '#ec4899', name: 'Pink' },
  { id: '#64748b', name: 'Grey' },
];

/**
 * @param {'income'|'expense'} kind
 * @returns {{name: string, icon: string, color: string, kind: string}} The starting draft.
 */
export function createCategoryDraft(kind) {
  return { name: '', icon: CATEGORY_ICONS[0], color: CATEGORY_COLORS[0].id, kind };
}

/**
 * Check the draft and build the repository input.
 * @param {{name: string, icon: string, color: string, kind: string}} draft
 * @returns {{input: object, problems: string[]}}
 */
export function buildCategoryInput(draft) {
  const name = draft.name.trim();
  const problems = [];
  if (!name) problems.push('Give the category a name.');
  else if (name.length > MAX_NAME_LENGTH) problems.push(`Use at most ${MAX_NAME_LENGTH} letters for the name.`);
  return { input: { name, icon: draft.icon, color: draft.color, kind: draft.kind }, problems };
}

/**
 * Start an edit from an existing category.
 * @param {{name: string, icon: string, color: string, kind: string}} category
 * @returns {{name: string, icon: string, color: string, kind: string}}
 */
export function categoryToDraft(category) {
  return { name: category.name, icon: category.icon, color: category.color, kind: category.kind };
}

/**
 * The icons to offer. A category may use an icon that is not in the preset list
 * (the default categories do), so the current one is added at the end.
 * @param {string} [current]
 * @returns {string[]}
 */
export function getIconChoices(current) {
  return !current || CATEGORY_ICONS.includes(current) ? CATEGORY_ICONS : [...CATEGORY_ICONS, current];
}

/**
 * The colors to offer, plus the category's own color when it is not a preset.
 * @param {string} [current]
 * @returns {Array<{id: string, name: string}>}
 */
export function getColorChoices(current) {
  const known = CATEGORY_COLORS.some((color) => color.id === current);
  return !current || known ? CATEGORY_COLORS : [...CATEGORY_COLORS, { id: current, name: 'Current color' }];
}
