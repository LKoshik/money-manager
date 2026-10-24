/**
 * Small helpers for building screens with plain DOM.
 * We never build HTML from strings, so text typed by a person (like a note)
 * can never be run as code.
 */

/**
 * Create an element.
 * @param {string} tag  Example: "div"
 * @param {{className?: string, text?: string, attrs?: Object<string, string>,
 *   on?: Object<string, Function>}} [options]  "on" maps event names to handlers.
 * @param {...(Node|string|null|false)} children  Empty values are skipped.
 * @returns {HTMLElement}
 */
export function el(tag, options = {}, ...children) {
  const { className, text, attrs = {}, on = {} } = options;
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  for (const [type, handler] of Object.entries(on)) node.addEventListener(type, handler);
  node.append(...children.flat().filter((child) => child != null && child !== false));
  return node;
}

/**
 * Draw a screen now, and draw it again every time the data changes.
 * @param {HTMLElement} container  Where the screen goes.
 * @param {(listener: Function) => (() => void)} subscribe  Usually store.subscribe.
 * @param {() => Node} build  Makes the screen from the current data.
 * @returns {() => void} Stop-listening function. Return it from a feature's render().
 */
export function renderLive(container, subscribe, build) {
  const draw = () => container.replaceChildren(build());
  draw();
  return subscribe(draw);
}
