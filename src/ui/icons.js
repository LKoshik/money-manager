/**
 * Icons. Each icon is a few line paths on a 24 x 24 grid, drawn in the
 * current text color. They are built with the DOM (no HTML strings).
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10', 'M10 20v-6h4v6'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  plus: ['M12 5v14', 'M5 12h14'],
  chart: ['M5 20V11', 'M12 20V4', 'M19 20v-6'],
  target: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18', 'M12 8a4 4 0 1 0 0 8 4 4 0 1 0 0-8', 'M12 12h.01'],
  wallet: ['M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M20 12h-4a2 2 0 0 0 0 4h4'],
  sliders: ['M4 7h9', 'M17 7h3', 'M13 7a2 2 0 1 0 4 0 2 2 0 1 0-4 0', 'M4 17h3', 'M11 17h9', 'M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0'],
  back: ['M15 5l-7 7 7 7'],
  forward: ['M9 5l7 7-7 7'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14', 'M20 20l-4-4'],
  filter: ['M4 6h16', 'M7 12h10', 'M10 18h4'],
  chevron: ['M6 9l6 6 6-6'],
  backspace: ['M21 5H9l-6 7 6 7h12z', 'M12 9l5 6', 'M17 9l-5 6'],
  repeat: ['M17 2l4 4-4 4', 'M3 11V9a3 3 0 0 1 3-3h15', 'M7 22l-4-4 4-4', 'M21 13v2a3 3 0 0 1-3 3H3'],
  swap: ['M7 7h13', 'M16 3l4 4-4 4', 'M17 17H4', 'M8 13l-4 4 4 4'],
  flag: ['M5 21V4', 'M5 4h12l-2 4 2 4H5'],
  alert: ['M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18', 'M12 8v5', 'M12 16h.01'],
};

/** The names you can pass to icon(). Features are checked against this list. */
export const ICON_NAMES = Object.keys(ICONS);

/**
 * Make an icon.
 * @param {string} name  One of ICON_NAMES.
 * @param {number} [size=24]  Width and height in pixels.
 * @returns {SVGElement}
 */
export function icon(name, size = 24) {
  const paths = ICONS[name];
  if (!paths) throw new Error(`Unknown icon: ${name}`);
  const svg = document.createElementNS(SVG_NS, 'svg');
  const attributes = {
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  };
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value);
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
