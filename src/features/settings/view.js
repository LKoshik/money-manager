/** The Settings screen: theme, backup, data protection, categories. */

import { el } from '../../ui/dom.js';
import { themeSection } from './themeSection.js';
import { backupSection } from './backupSection.js';
import { storageSection } from './storageSection.js';
import { categoriesSection } from './categoriesSection.js';

/**
 * Build the Settings screen.
 * @param {{settings: object, categories: object[], transactions: object[]}} state
 * @param {{storage: 'checking'|'protected'|'unprotected'|'unsupported'}} local  Screen-only state.
 * @param {{onProtect: () => void}} handlers
 * @returns {HTMLElement}
 */
export function buildView(state, local, handlers) {
  const hasData = state.transactions.length > 0;
  return el(
    'div',
    { className: 'stack' },
    themeSection(state.settings),
    backupSection(state.settings, hasData),
    storageSection(local.storage, handlers.onProtect),
    categoriesSection(state),
  );
}
