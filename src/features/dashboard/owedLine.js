/** The small "Owed to you ₹X · You owe ₹Y" line on Home. It opens the Lent & borrowed screen. */

import { el } from '../../ui/dom.js';
import { navigate } from '../../ui/router.js';
import { owedLine as owedText } from '../../core/loanText.js';

/**
 * @param {{toYou: number, youOwe: number}} owed
 * @returns {HTMLElement|null} Null when nothing is owed either way.
 */
export function owedLine(owed) {
  const text = owedText(owed);
  if (!text) return null;
  return el('button', { className: 'owed-line', text, attrs: { type: 'button' }, on: { click: () => navigate('/lent') } });
}
