/** A plain, readable table: the text version of a chart. */

import { el } from './dom.js';

/**
 * Make a table. The first column is the row title, the other columns are numbers (right aligned).
 * @param {{caption: string, headers: string[], rows: string[][]}} config
 * @returns {HTMLTableElement}
 */
export function dataTable({ caption, headers, rows }) {
  const head = el('tr', {}, ...headers.map((text, i) => el('th', { text, className: i > 0 ? 'num' : '', attrs: { scope: 'col' } })));
  const body = rows.map((row) =>
    el('tr', {}, ...row.map((text, i) => (i === 0 ? el('th', { text, attrs: { scope: 'row' } }) : el('td', { text, className: 'num' })))),
  );
  return el('table', { className: 'data-table' }, el('caption', { text: caption }), el('thead', {}, head), el('tbody', {}, ...body));
}
