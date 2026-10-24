/** A reusable button. At least 44px tall, so it is easy to tap. */

import { el } from './dom.js';
import { icon } from './icons.js';

/**
 * Make a button.
 * @param {{label?: string, icon?: string, variant?: 'primary'|'secondary'|'ghost'|'danger',
 *   block?: boolean, onClick?: Function, type?: string, disabled?: boolean,
 *   ariaLabel?: string}} options  "block" makes it full width.
 * @returns {HTMLButtonElement}
 */
export function button({
  label,
  icon: iconName,
  variant = 'primary',
  block = false,
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
}) {
  const className = ['btn', `btn--${variant}`, block && 'btn--block'].filter(Boolean).join(' ');
  const attrs = { type };
  if (ariaLabel) attrs['aria-label'] = ariaLabel;
  if (disabled) attrs.disabled = '';
  return el(
    'button',
    { className, attrs, on: onClick ? { click: onClick } : {} },
    iconName && icon(iconName, 20),
    label && el('span', { text: label }),
  );
}
