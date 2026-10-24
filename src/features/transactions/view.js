import { el } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { store } from '../../state/store.js';
import { countActiveFilters } from '../../core/transactionFilter.js';
import { getFilters, patchFilters, resetFilters } from './logic.js';
import { buildList } from './list.js';
import { openFilterSheet } from './filterSheet.js';

function buildToolbar({ onSearch, onFilter }) {
  const search = el('input', {
    className: 'search-input',
    attrs: { type: 'search', placeholder: 'Search transactions', 'aria-label': 'Search transactions', autocomplete: 'off', value: getFilters().query },
    on: { input: () => onSearch(search.value) },
  });
  const badge = el('span', { className: 'filter-badge' });
  const filterButton = el('button', { className: 'filter-btn', attrs: { type: 'button', 'aria-label': 'Filters' }, on: { click: onFilter } }, icon('filter'), badge);
  const element = el('div', { className: 'txn-toolbar' }, search, filterButton);
  const setBadge = (count) => {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  };
  return { element, search, setBadge };
}

/**
 * Build the History screen.
 * The search box is NOT redrawn when data changes (it would lose the keyboard);
 * only the list below it is.
 * @returns {{element: HTMLElement, destroy: () => void}} destroy stops listening to the store.
 */
export function buildScreen() {
  const listHost = el('div');
  const toolbar = buildToolbar({ onSearch, onFilter });
  const redraw = () => {
    listHost.replaceChildren(buildList(store.getState(), clearAll));
    toolbar.setBadge(countActiveFilters(getFilters()));
  };

  function onSearch(query) {
    patchFilters({ query });
    redraw();
  }
  function onFilter() {
    openFilterSheet({
      filters: getFilters(),
      state: store.getState(),
      onApply(next) {
        patchFilters(next);
        redraw();
      },
    });
  }
  function clearAll() {
    resetFilters();
    toolbar.search.value = '';
    redraw();
  }

  redraw();
  return { element: el('div', {}, toolbar.element, listHost), destroy: store.subscribe(redraw) };
}
