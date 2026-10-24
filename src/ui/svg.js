/**
 * Build SVG elements. el() cannot do this: document.createElement makes HTML
 * elements, and SVG needs its own namespace. Still no HTML strings.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an SVG element.
 * @param {string} tag  Example: "path"
 * @param {Object<string, string|number>} [attrs]  Attributes (use "class", not "className").
 * @param {...(Node|string|null|false)} children  Strings become text. Empty values are skipped.
 * @returns {SVGElement}
 */
export function svgEl(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
}
