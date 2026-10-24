/** Small pieces shared by the forms: a labelled text box and an error message. */

import { el } from './dom.js';

/**
 * A labelled input. By default it is a text box; pass attrs.type to change that.
 * @param {{label: string, value?: string, onInput: (value: string) => void,
 *   attrs?: Object<string, string>}} config
 * @returns {{element: HTMLElement, input: HTMLInputElement, labelNode: HTMLElement}}
 *   labelNode lets the caller change the label later.
 */
export function textField({ label, value = '', onInput, attrs = {} }) {
  const input = el('input', {
    className: 'field-input',
    attrs: { type: 'text', value, ...attrs },
    on: { input: () => onInput(input.value) },
  });
  const labelNode = el('span', { className: 'field-label', text: label });
  return { element: el('label', { className: 'field' }, labelNode, input), input, labelNode };
}

/**
 * A red message box that is hidden until there is something to say.
 * @returns {{element: HTMLElement, show: (problems: string[]) => void, clear: () => void}}
 */
export function errorBox() {
  const element = el('p', { className: 'form-error', attrs: { role: 'alert' } });
  element.hidden = true;
  return {
    element,
    show(problems) {
      element.textContent = problems.join(' ');
      element.hidden = false;
    },
    clear() {
      element.hidden = true;
    },
  };
}
