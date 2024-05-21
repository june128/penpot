/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import cljs from "goog:cljs.core";
import Keyword from "../Keyword";

/**
 * Type values for content nodes.
 */
const ContentType = {
  ROOT: "root",
  PARAGRAPH_SET: "paragraph-set",
  PARAGRAPH: "paragraph",
  INLINE: "inline",
};

const Attrs = {
  // Root attributes mapping.
  Root: [[Keyword.VERTICAL_ALIGN, "vertical-align"]],
  // Paragraph attributes mapping.
  Paragraph: [
    [Keyword.TEXT_ALIGN, "text-align"],
    [Keyword.DIRECTION, "direction"],
    [Keyword.LINE_HEIGHT, "line-height"],
    [Keyword.FONT_SIZE, "font-size", "px"],
  ],
  // Inline attributes mapping.
  Inline: [
    [Keyword.TYPOGRAPHY_REF_ID, "--typography-ref-id"],
    [Keyword.TYPOGRAPHY_REF_FILE, "--typography-ref-file"],

    [Keyword.FONT_ID, "--font-id"],
    [Keyword.FONT_VARIANT_ID, "font-variant"],
    [Keyword.FONT_FAMILY, "font-family"],
    [Keyword.FONT_SIZE, "font-size", "px"],
    [Keyword.FONT_WEIGHT, "font-weight"],
    [Keyword.FONT_STYLE, "font-style"],

    [Keyword.LINE_HEIGHT, "line-height"],
    [Keyword.LETTER_SPACING, "letter-spacing", "px"],

    [Keyword.TEXT_DECORATION, "text-decoration"],
    [Keyword.TEXT_TRANSFORM, "text-transform"],

    [Keyword.FILLS, "--fills"],
  ],
};

/**
 * Returns true if a ContentNode is a ClojureScript IMap.
 *
 * @param {ContentNode} contentNode
 * @returns {boolean}
 */
function isMap(contentNode) {
  return cljs.map_QMARK_(contentNode);
}

/**
 * Returns true if a ContentNode has an especific type.
 *
 * @param {ContentNode} contentNode
 * @param {string} expectedType
 * @returns {boolean}
 */
function hasType(contentNode, expectedType) {
  return cljs.get(contentNode, Keyword.TYPE) === expectedType;
}

/**
 * Returns the ContentNode children.
 *
 * @param {ContentNode} contentNode
 * @returns {cljs.PersistentVector}
 */
function getChildren(contentNode) {
  return cljs.get(contentNode, Keyword.CHILDREN);
}

/**
 * Iterates through ContentNode children.
 *
 * @param {ContentNode} contentNode
 * @returns {Generator<ContentNode>}
 */
function* childrenOf(contentNode) {
  const children = getChildren(contentNode);
  const count = cljs.count(children);
  for (let index = 0; index < count; index++) {
    yield cljs.nth(children, index);
  }
}

/**
 * Returns the first child of a ContentNode.
 *
 * @param {ContentNode} contentNode
 * @returns {ContentNode}
 */
function getFirstChild(contentNode) {
  return cljs.first(getChildren(contentNode));
}

/**
 * Returns true if has exactly the amount of specified children.
 *
 * @param {ContentNode} contentNode
 * @param {number} expectedAmount
 * @returns {boolean}
 */
function hasExactlyChildren(contentNode, expectedAmount) {
  const children = getChildren(contentNode);
  return cljs.count(children) === expectedAmount;
}

/**
 * Returns true if has at least the amount of specified children.
 *
 * @param {ContentNode} contentNode
 * @param {number} expectedAmount
 * @returns {boolean}
 */
function hasAtLeastChildren(contentNode, expectedAmount) {
  const children = getChildren(contentNode);
  return cljs.count(children) >= expectedAmount;
}

/**
 * Returns true if the argument is a ContentRoot
 *
 * @param {cljs.PersistentHashMap} root
 * @returns {[boolean, Error?]}
 */
function validateRoot(root) {
  if (!isMap(root)) {
    return [false, new Error("Root is not a PersistentHashMap")];
  }
  if (!hasType(root, ContentType.ROOT)) {
    return [false, new Error('Root doesn\'t have type "root"')];
  }
  if (!hasExactlyChildren(root, 1)) {
    return [false, new Error("Root doesn't have exactly one child")];
  }
  return [true];
}

/**
 * Returns true if the argument is a ContentParagraphSet
 *
 * @param {cljs.PersistentHashMap} paragraphSet
 * @returns {[boolean,Error?]}
 */
function validateParagraphSet(paragraphSet) {
  if (!isMap(paragraphSet)) {
    return [false, new Error("ParagraphSet is not a PersistentHashMap")];
  }
  if (!hasType(paragraphSet, ContentType.PARAGRAPH_SET)) {
    return [
      false,
      new Error('ParagraphSet doesn\'t have type "paragraph-set"'),
    ];
  }
  if (!hasAtLeastChildren(paragraphSet, 1)) {
    return [false, new Error("ParagraphSet doesn't have at least one child")];
  }
  return [true];
}

/**
 * Returns [true] if the argument is a ContentParagraph
 *
 * @param {cljs.PersistentHashMap} paragraph
 * @returns {[boolean,Error?]}
 */
function validateParagraph(paragraph) {
  if (!isMap(paragraph)) {
    return [false, new Error("Paragraph is not a PersistentHashMap")];
  }
  if (!hasType(paragraph, ContentType.PARAGRAPH)) {
    return [false, new Error('Paragraph doesn\'t have type "paragraph"')];
  }
  if (!hasAtLeastChildren(paragraph, 1)) {
    return [false, new Error("Paragraph doesn't have at least one child")];
  }
  return [true];
}

/**
 * Validates content
 *
 * @param {Content} content
 * @returns {[boolean, Error?]}
 */
function validateContent(content) {
  const root = content;
  if (root === null) {
    return [true];
  }
  const [isValidRoot, rootError] = validateRoot(root);
  if (!isValidRoot) {
    return [false, rootError];
  }
  const paragraphSet = getFirstChild(root);
  const [isValidParagraphSet, paragraphSetError] =
    validateParagraphSet(paragraphSet);
  if (!isValidParagraphSet) {
    return [false, paragraphSetError];
  }
  for (const paragraph of childrenOf(paragraphSet)) {
    const [isValidParagraph, paragraphError] = validateParagraph(paragraph);
    if (!isValidParagraph) {
      return [false, paragraphError];
    }
  }
  return [true];
}

/**
 * Creates a new text node.
 *
 * NOTE: This is the equivalent of an `inline` DOM
 * element.
 *
 * @param {string} text
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {cljs.PersistentHashMap}
 */
function createText(text, [keys = [], values = []]) {
  return cljs.PersistentHashMap.fromArrays(
    [Keyword.TEXT, ...keys],
    [text, ...values],
  );
}

/**
 * Creates a new paragraph.
 *
 * @param {Array<ContentText>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {cljs.PersistentHashMap}
 */
function createParagraph(children, [keys = [], values = []]) {
  return cljs.PersistentHashMap.fromArrays(
    [Keyword.TYPE, Keyword.CHILDREN, ...keys],
    [ContentType.PARAGRAPH, children, ...values],
  );
}

/**
 * Creates a new paragraph-set.
 *
 * @param {Array<ContentParagraph>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {cljs.PersistentHashMap}
 */
function createParagraphSet(children, [keys = [], values = []]) {
  return cljs.PersistentHashMap.fromArrays(
    [Keyword.TYPE, Keyword.CHILDREN, ...keys],
    [ContentType.PARAGRAPH_SET, children, ...values],
  );
}

/**
 * Creates a new root.
 *
 * @param {Array<ContentParagraphSet>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {cljs.PersistentHashMap}
 */
function createRoot(children, [keys = [], values = []]) {
  return cljs.PersistentHashMap.fromArrays(
    [Keyword.TYPE, Keyword.CHILDREN, ...keys],
    [ContentType.ROOT, children, ...values],
  );
}

/**
 * Maps style fills.
 *
 * @param {Array.<Fill>} fills
 * @returns {PersistentVector<PersistentHashMap<Keyword, *>>}
 */
function mapStyleFills(fills) {
  if (Array.isArray(fills)) {
    return cljs.PersistentVector.fromArray(
      fills.map((fill) => {
        // TODO: Esto debería tener en cuenta los diferentes
        // tipos de fill que tenemos en la aplicación.
        return cljs.PersistentHashMap.fromArrays(
          [Keyword.FILL_COLOR, Keyword.FILL_OPACITY],
          [fill["fill-color"], fill["fill-opacity"]],
        );
      }),
    );
  }
  return null;
}

/**
 * Returns a style from style declaration.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string} styleName
 * @param {string} [styleUnits]
 * @returns {string}
 */
function getStyleValue(style, styleName, styleUnits) {
  const styleValue = styleUnits
    ? style.getPropertyValue(styleName).replace(styleUnits, "")
    : style.getPropertyValue(styleName);
  if (styleName.startsWith("--")) {
    try {
      const stylePayload = JSON.parse(styleValue);
      if (styleName === "--fills") {
        return mapStyleFills(stylePayload);
      } else if (stylePayload === "null") {
        return null;
      }
      return stylePayload;
    } catch (error) {
      return null;
    }
  }
  return styleValue;
}

/**
 * Gets a map of styles.
 *
 * @param {HTMLElement} element
 * @param {Array.<[cljs.keyword, string, ?string]>} attrs
 * @returns {Object.<cljs.keyword, *>}
 */
function getStyleMap(element, attrs) {
  const style = window.getComputedStyle(element);
  const styleMap = {};
  for (const [key, styleName, styleUnits] of attrs) {
    const value = getStyleValue(style, styleName, styleUnits);
    styleMap[key] = value;
  }
  return styleMap;
}

/**
 * Returns styles from an HTMLElement.
 *
 * @param {HTMLElement} element
 * @param {Array.<[cljs.keyword, string, ?string]>} attrs
 * @returns {[cljs.keyword[], any[]]}
 */
function getStylesFromElement(element, attrs) {
  const styleMap = getStyleMap(element, attrs);
  return [
    Array.from(Object.keys(styleMap)),
    Array.from(Object.values(styleMap)),
  ];
}

/**
 * Extracts root styles from a HTMLDivElement.
 *
 * @param {HTMLDivElement} element
 * @returns {[cljs.keyword[], any[]]}
 */
const getRootStyles = (element) => getStylesFromElement(element, Attrs.Root);

/**
 * Extracts paragraph styles from a HTMLDivElement.
 *
 * @param {HTMLDivElement} element
 * @returns {[cljs.keyword[], any[]]}
 */
const getParagraphStyles = (element) => getStylesFromElement(element, Attrs.Paragraph);

/**
 * Returns the inline styles from a HTMLSpanElement.
 *
 * @param {HTMLSpanElement} element
 * @returns {[cljs.keyword[], any[]]}
 */
const getInlineStyles = (element) => getStylesFromElement(element, Attrs.Inline);

/**
 * Returns attributes from a content node.
 *
 * @param {cljs.PersistentHashMap} contentNode
 * @returns {Object.<string, *>}
 */
function getAttrsFromContentNode(contentNode) {
  const attrs = {};
  if (cljs.contains_QMARK_(contentNode, Keyword.KEY)) {
    attrs.id = cljs.get(contentNode, Keyword.KEY);
  }
  return attrs;
}

/**
 * Creates a new element style from a ContentNode
 *
 * @param {ContentNodeAttributes} attrs
 * @param {ContentNode} contentNode
 * @returns {ElementStyle}
 */
function createElementStylesFromContentNode(attrs, contentNode) {
  const style = {};
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (cljs.contains_QMARK_(contentNode, contentAttr)) {
      const value = cljs.get(contentNode, contentAttr);
      const valueUnits = styleUnits ? styleUnits : "";
      style[elementStyle] = `${value}${valueUnits}`;
    }
  }
  return style;
}

/**
 * Creates a new function that maps a content node into an
 * HTML element.
 *
 * @param {cljs.PersistentHashMap} attrs Attributes to use.
 * @param {Function} childrenFn The function used to map children nodes.
 * @param {Function} mapFn The function used to create the elements.
 * @returns {Function}
 */
function createContentNodeMapper(attrs, childrenFn, mapFn) {
  return function createElementStylesFromContentNodeFn(contentNode, editor) {
    return editor[mapFn](
      childrenFn(contentNode),
      createElementStylesFromContentNode(attrs, contentNode),
      getAttrsFromContentNode(contentNode));
  }
}

/**
 * Creates a new root from a content node.
 *
 * @param {cljs.PersistentHashMap} node
 * @returns {HTMLDivElement}
 */
const createRootElementFromContentNode = createContentNodeMapper(Attrs.Root, () => [], "createRoot");

/**
 * Creates a new paragraph from a content node.
 *
 * @param {cljs.PersistentHashMap} node
 * @returns {HTMLDivElement}
 */
const createParagraphElementFromContentNode = createContentNodeMapper(Attrs.Paragraph, () => [], "createParagraph");

/**
 * Creates a new inline element from a content node.
 *
 * @param {cljs.PersistentHashMap} node
 * @returns {HTMLDivElement}
 */
const createInlineElementFromContentNode = createContentNodeMapper(Attrs.Inline, (contentNode) => cljs.get(contentNode, Keyword.TEXT), "createInlineFromString");

/**
 * Maps the CLJS content structure into
 * a TextEditor DOM.
 *
 * @param {cljs.PersistentHashMap} contentRoot
 * @returns {HTMLDivElement}
 */
export function fromCLJSToDOM(contentRoot, editor) {
  const [isValid, error] = validateContent(contentRoot);
  if (!isValid) {
    throw error;
  }
  const root = contentRoot;
  const rootNode = createRootElementFromContentNode(root, editor);
  const paragraphSet = getFirstChild(root);
  for (const paragraph of childrenOf(paragraphSet)) {
    const paragraphNode = createParagraphElementFromContentNode(
      paragraph,
      editor,
    );
    for (const inline of childrenOf(paragraph)) {
      const inlineNode = createInlineElementFromContentNode(inline, editor);
      paragraphNode.appendChild(inlineNode);
    }
    rootNode.appendChild(paragraphNode);
  }
  return rootNode;
}

/**
 * Returns if an element is a line break.
 *
 * @param {Node} element
 * @returns {boolean}
 */
function isLineBreak(element) {
  return element.nodeType === Node.ELEMENT_NODE && element.nodeName === "BR";
}

/**
 * Maps the TextEditor DOM into the CLJS
 * content structure.
 *
 * @param {HTMLDivElement} rootNode
 * @returns {cljs.PersistentHashMap|null}
 */
export function fromDOMToCLJS(rootNode) {
  if (!rootNode) {
    return null;
  }
  const rootChildren = cljs.PersistentVector.fromArray(
    Array.from(rootNode.children).map((paragraph) => {
      const paragraphChildren = cljs.PersistentVector.fromArray(
        Array.from(paragraph.children).map((inline) => {
          const inlineStyles = getInlineStyles(inline);
          if (isLineBreak(inline.firstChild)) {
            return createText("\n", inlineStyles);
          }
          return createText(inline.firstChild.nodeValue, inlineStyles);
        }),
        false,
      );
      return createParagraph(paragraphChildren, getParagraphStyles(paragraph));
    }),
    false,
  );
  const rootStyles = getRootStyles(rootNode);
  const root = createRoot(
    cljs.PersistentVector.fromArray([createParagraphSet(rootChildren, [])]),
    rootStyles,
  );
  return root;
}
