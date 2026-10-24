/** A donut chart drawn with SVG. It only gets plain data, so any screen can reuse it. */

import { svgEl } from './svg.js';
import { buildDonut } from '../core/chartGeometry.js';
import { safeColor } from '../core/chartColor.js';

const SIZE = 200;
const CENTER = SIZE / 2;
const THICKNESS = 30;
const RADIUS = 76; // middle of the ring: arcs are stroked, so the ring spans 61..91

function slicePart(shape, slice) {
  const color = safeColor(slice.color);
  const attrs = {
    class: color ? 'pie-slice' : 'pie-slice pie-slice--plain',
    fill: 'none',
    'stroke-width': THICKNESS,
    'data-slice': slice.id,
  };
  if (color) attrs.style = `stroke:${color}`;
  if (shape.kind === 'circle') return svgEl('circle', { ...attrs, cx: shape.cx, cy: shape.cy, r: shape.r });
  return svgEl('path', { ...attrs, d: shape.d });
}

function centerText(label, value) {
  const long = value.length > 11 ? ' pie-center-value--long' : '';
  return [
    label && svgEl('text', { class: 'pie-center-label', x: CENTER, y: CENTER - 6, 'text-anchor': 'middle' }, label),
    value && svgEl('text', { class: `pie-center-value${long}`, x: CENTER, y: CENTER + 16, 'text-anchor': 'middle' }, value),
  ];
}

/**
 * Make a donut chart. Slices with a value of 0 or less are left out.
 * @param {{slices: Array<{id: string, label: string, value: number, color?: string|null}>,
 *   centerLabel?: string, centerValue?: string, ariaLabel: string}} config
 *   color must be a #hex color (anything else gets the plain color). ariaLabel describes the data in words.
 * @returns {SVGElement}
 */
export function pieChart({ slices, centerLabel = '', centerValue = '', ariaLabel }) {
  const shapes = buildDonut(slices.map((slice) => slice.value), { cx: CENTER, cy: CENTER, radius: RADIUS });
  const parts = shapes.map((shape) => slicePart(shape, slices[shape.index]));
  return svgEl(
    'svg',
    { class: 'pie-chart', viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img', 'aria-label': ariaLabel },
    ...parts,
    ...centerText(centerLabel, centerValue),
  );
}
