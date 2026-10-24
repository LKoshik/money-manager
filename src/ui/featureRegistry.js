/**
 * Turns the list of feature modules into what the app shell needs:
 * routes, tabs and the "+" quick action. It also checks every feature,
 * so a mistake shows a clear message at start instead of a strange bug later.
 *
 * A feature module exports:
 *   id, title, icon, route, render(container, route)   (required)
 *   order      number, where it sits in the tab bar (default 100)
 *   nav        false = no tab (reach it from a link)  (default true)
 *   tabLabel   a shorter name for the tab bar (default: title)
 *   quickAction  { title, icon?, open() }  for the big "+" button (only one feature may have it)
 */

import { ICON_NAMES } from './icons.js';

const DEFAULT_ORDER = 100;
const REQUIRED = [
  ['id', 'string'],
  ['title', 'string'],
  ['icon', 'string'],
  ['route', 'string'],
  ['render', 'function'],
];

function checkFeature(feature) {
  const name = `Feature "${feature.id ?? '?'}"`;
  for (const [field, type] of REQUIRED) {
    if (typeof feature[field] !== type) throw new Error(`${name}: "${field}" must be a ${type}`);
  }
  if (!feature.route.startsWith('/')) throw new Error(`${name}: route must start with "/"`);
  if (!ICON_NAMES.includes(feature.icon)) throw new Error(`${name}: unknown icon "${feature.icon}"`);
  const action = feature.quickAction;
  if (!action) return;
  if (typeof action.title !== 'string' || typeof action.open !== 'function') {
    throw new Error(`${name}: quickAction needs a title and an open() function`);
  }
  if (action.icon && !ICON_NAMES.includes(action.icon)) throw new Error(`${name}: unknown quickAction icon`);
}

function checkUnique(features, field) {
  const seen = new Set();
  for (const feature of features) {
    if (seen.has(feature[field])) throw new Error(`Two features use the same ${field}: "${feature[field]}"`);
    seen.add(feature[field]);
  }
}

/**
 * Build the registry.
 * @param {object[]} modules  The feature modules (from features/index.js).
 * @returns {{features: object[], tabs: object[], quickAction: object|null}}
 *   features and tabs are sorted by "order".
 * @throws {Error} With a clear message if a feature is wrong.
 */
export function buildRegistry(modules) {
  const features = modules.map((module) => ({ nav: true, order: DEFAULT_ORDER, ...module }));
  features.forEach(checkFeature);
  checkUnique(features, 'id');
  checkUnique(features, 'route');
  if (!features.some((feature) => feature.route === '/')) {
    throw new Error('One feature must use the route "/" (the home screen)');
  }
  features.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const withAction = features.filter((feature) => feature.quickAction);
  if (withAction.length > 1) throw new Error('Only one feature can have a quickAction');
  return {
    features,
    tabs: features.filter((feature) => feature.nav),
    quickAction: withAction[0]?.quickAction ?? null,
  };
}
