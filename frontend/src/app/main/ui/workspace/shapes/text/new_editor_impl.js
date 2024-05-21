/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import TextEditor from './new_editor/TextEditor.js';
import textLayoutImpl from './new_editor/TextLayout.js';
import { fromCLJSToDOM, fromDOMToCLJS } from './new_editor/content/ContentMapping.js';

/**
 * @typedef {Object} SetContentOptions
 * @property {boolean} [selectAll=false]
 */

/**
 * Applies styles to the current selection or the
 * saved selection.
 *
 * @param {TextEditor} editor
 * @param {*} styles
 */
export function applyStylesToSelection(editor, styles) {
  return editor.applyStylesToSelection(styles);
}

/**
 * Sets the content of the editor from a valid
 * ClojureScript structure.
 *
 * @param {TextEditor} editor
 * @param {Content} newContent
 * @param {SetContentOptions} [options]
 * @returns {TextEditor}
 */
export function setContent(editor, newContent, options) {
  debugger;
  editor.root.replaceWith(
    fromCLJSToDOM(newContent, editor)
  );
  if (options?.selectAll) {
    editor.selectAll();
  }
  return editor;
}

/**
 * Retrieves the content of the editor as a valid
 * ClojureScript structure.
 *
 * @param {TextEditor} editor
 * @returns {cljs.PersistentHashMap}
 */
export function getContent(editor) {
  return fromDOMToCLJS(editor.root);
}

/**
 * Performs a layout operation from content.
 *
 * @param {cljs.PersistentHashMap} content
 * @param {*} options
 * @returns {ContentLayout}
 */
export function layoutFromContent(content, options) {
  return textLayout.layoutFromContent(content, options);
}

/**
 * Performs a layout operation using a HTML element.
 *
 * @param {HTMLElement} element
 * @returns {ContentLayout}
 */
export function layoutFromElement(element) {
  return textLayout.layoutFromElement(element);
}

/**
 * Performs a layout operation using a TextEditor.
 *
 * @param {TextEditor} editor
 * @returns {ContentLayout}
 */
export function layoutFromEditor(editor) {
  console.log('Layout!');
  return textLayout.layoutFromElement(editor.element);
}

/**
 * Creates a new Text Editor instance.
 *
 * @param {HTMLElement} element
 * @param {object} options
 * @returns {TextEditor}
 */
export function createTextEditor(element, options) {
  return new TextEditor(element, {
    ...options
  });
}

export const textLayout = textLayoutImpl;

export default {
  textLayout,
  createTextEditor,
  getContent,
  setContent,
  layoutFromContent,
  layoutFromEditor,
  layoutFromElement
}
