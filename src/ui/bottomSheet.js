/** A panel that slides up from the bottom of the screen. */

import { openOverlay } from './overlay.js';

/**
 * Open a bottom sheet.
 * @param {{title: string, content: Node, onClose?: () => void, dismissible?: boolean}} options
 * @returns {{close: () => Promise<void>, element: HTMLElement}}
 */
export function openBottomSheet(options) {
  return openOverlay({ ...options, variant: 'sheet' });
}
