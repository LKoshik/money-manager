/** The list of people on the Lent & borrowed screen (one row per person). */

import { el } from '../../ui/dom.js';
import { listRow } from '../../ui/listRow.js';
import { openPersonSheet } from './personSheet.js';
import { daysToDue } from '../../core/loanModel.js';
import { personSubtitle } from '../../core/loanText.js';
import { formatMoney } from '../../core/money.js';

/** Days to the most urgent due date among the person's open loans (negative = overdue). */
function urgentDays(person, now) {
  const days = person.rows.map((row) => daysToDue(row.loan, row.outstanding, now)).filter((value) => value !== null);
  return days.length > 0 ? Math.min(...days) : null;
}

/**
 * @param {Array<object>} people  From buildPeople().
 * @param {'lent'|'borrowed'} direction
 * @param {Date} now
 * @returns {HTMLElement}
 */
export function peopleList(people, direction, now) {
  const rows = people.map((person) =>
    listRow({
      icon: '👤',
      title: person.name,
      subtitle: personSubtitle(person, urgentDays(person, now)),
      amount: formatMoney(person.outstanding),
      amountClass: person.settled ? '' : direction === 'lent' ? 'amount--income' : 'amount--expense',
      onClick: () => openPersonSheet(direction, person.key),
    }),
  );
  return el('div', { className: 'list-card' }, ...rows);
}
