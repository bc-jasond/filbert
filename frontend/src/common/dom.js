import {
  DOM_ELEMENT_NODE_TYPE_ID,
  DOM_INPUT_TAG_NAME,
  DOM_TEXT_NODE_TYPE_ID,
  KEYCODE_ALT,
  KEYCODE_CAPS_LOCK,
  KEYCODE_COMMAND_RIGHT,
  KEYCODE_CTRL,
  KEYCODE_DOWN_ARROW,
  KEYCODE_END,
  KEYCODE_ENTER,
  KEYCODE_ESC,
  KEYCODE_F1,
  KEYCODE_F10,
  KEYCODE_F11,
  KEYCODE_F12,
  KEYCODE_F2,
  KEYCODE_F3,
  KEYCODE_F4,
  KEYCODE_F5,
  KEYCODE_F6,
  KEYCODE_F7,
  KEYCODE_F8,
  KEYCODE_F9,
  KEYCODE_HOME,
  KEYCODE_LEFT_ARROW,
  KEYCODE_PAGE_DOWN,
  KEYCODE_PAGE_UP,
  KEYCODE_PRINT_SCREEN,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_TAB,
  KEYCODE_UP_ARROW,
  NODE_TYPE_H1,
  NODE_TYPE_LI,
  NODE_TYPE_P
} from './constants';
import { cleanText } from './utils';

export function removeAllRanges() {
  const sel = window.getSelection();
  sel.removeAllRanges();
  return sel;
}

export function getRange() {
  const sel = window.getSelection();
  if (sel.rangeCount < 1) {
    return null;
  }
  return sel.getRangeAt(0);
}

export function getNodeId(node) {
  return node && node.getAttribute ? node.getAttribute('name') : null;
}

export function getNodeById(nodeId) {
  const [first] = document.getElementsByName(nodeId);
  return first;
}

export function getFirstHeadingContent() {
  const [h1] = document.querySelectorAll(`[data-type='${NODE_TYPE_H1}']`);
  return h1 ? h1.textContent : '';
}

/**
 * given an offset in a parent 'paragraph', return a child text node and child offset
 */
export function getChildTextNodeAndOffsetFromParentOffset(
  parent,
  parentOffset
) {
  let childOffset =
    parentOffset === -1 ? parent.textContent.length : parentOffset;
  const textNodesOnlyFlattened = [];
  const queue = [...parent.childNodes];
  // there's no formatting, so no offset adjustment necessary
  const [firstNode] = queue;
  if (queue.length === 1 && firstNode.nodeType === DOM_TEXT_NODE_TYPE_ID) {
    return { childNode: firstNode, childOffset };
  }
  while (queue.length) {
    const currentNode = queue.shift();
    if (currentNode.nodeType === DOM_TEXT_NODE_TYPE_ID) {
      textNodesOnlyFlattened.push(currentNode);
    }
    queue.unshift(...currentNode.childNodes);
  }
  let childNode;
  // assume 'parent' is a 'paragraph' with an id
  for (let i = 0; i < textNodesOnlyFlattened.length; i++) {
    // TODO
    /* eslint-disable-next-line prefer-destructuring */
    childNode = textNodesOnlyFlattened[i];
    // assume max depth level one for text nodes AKA no tags within tags here for formatting
    if (childNode.textContent.length >= childOffset) {
      break;
    }
    childOffset -= childNode.textContent.length;
  }
  return { childNode, childOffset };
}

export function getFirstAncestorWithId(domNode) {
  if (!domNode) return null;
  if (
    domNode.nodeType === DOM_ELEMENT_NODE_TYPE_ID &&
    domNode.getAttribute('name')
  )
    return domNode;
  // walk ancestors until one has a truthy 'name' attribute
  // 'name' === id in the db
  let { parentElement: current } = domNode;
  while (current && !current.getAttribute('name')) {
    /* eslint-disable-next-line prefer-destructuring */
    current = current.parentElement;
  }
  return current;
}

export function scrollToCaretIfOutOfView(nodeId) {
  let rect;
  let node;
  if (!nodeId) {
    const range = getRange();
    if (!range.collapsed) {
      return;
    }
    node = getFirstAncestorWithId(range.commonAncestorContainer);
    rect = range.getBoundingClientRect();
  } else {
    node = getNodeById(nodeId);
    rect = node.getBoundingClientRect();
  }

  const middleOfViewport = window.innerHeight / 2;

  if (
    // out of view UP
    rect.top < 0 ||
    // out of view DOWN
    rect.top > window.innerHeight ||
    // close to top edge
    rect.top < 200 ||
    // close to bottom edge
    window.innerHeight - rect.top < 200
  ) {
    let totalOffset = 0;
    while (node?.offsetTop > 0) {
      totalOffset += node.offsetTop;
      /* eslint-disable-next-line prefer-destructuring */
      node = node.offsetParent;
    }
    window.scrollTo({
      top: totalOffset - middleOfViewport,
      behavior: 'smooth'
    });
  }
}

export function focusAndScrollSmooth(nodeId, inputElem, setCaretToEnd = true) {
  const { activeElement } = document;
  if (!inputElem || activeElement === inputElem) {
    return;
  }
  inputElem.focus({ preventScroll: true });
  const caretPosition = setCaretToEnd ? inputElem.value.length : 0;
  inputElem.setSelectionRange(caretPosition, caretPosition);
  scrollToCaretIfOutOfView(nodeId);
}

//  takes a nodeId and a start and end position relative to the node content (container.textContent) and sets a new DOM range (selection)
export function replaceRange({ startNodeId, endNodeId, caretStart, caretEnd }) {
  const selection = window.getSelection();
  const replacementRange = document.createRange();
  const startContainer = getNodeById(startNodeId);
  const {
    childNode: startNode,
    childOffset: startOffset
  } = getChildTextNodeAndOffsetFromParentOffset(startContainer, caretStart);
  replacementRange.setStart(startNode, startOffset);
  const endContainer = endNodeId ? getNodeById(endNodeId) : startContainer;
  const {
    childNode: endNode,
    childOffset: endOffset
  } = getChildTextNodeAndOffsetFromParentOffset(endContainer, caretEnd);
  replacementRange.setEnd(endNode, endOffset);
  selection.removeAllRanges();
  selection.addRange(replacementRange);
  return replacementRange;
}
// TODO: refactor to take one argument: selectionOffsets
// TODO: combine this with replaceRange();
export function setCaret({ startNodeId, caretStart = -1 }) {
  const [containerNode] = document.getElementsByName(startNodeId);
  if (!containerNode) {
    console.warn('setCaret containerNode NOT FOUND ', startNodeId);
    return;
  }
  console.info('setCaret containerNode ', startNodeId);
  // has a text node?
  const sel = removeAllRanges();
  const range = document.createRange();
  // find text node, if present
  let textNode;
  if ([NODE_TYPE_P, NODE_TYPE_LI].includes(containerNode.dataset.type)) {
    ({
      childNode: textNode,
      childOffset: caretStart // eslint-disable-line no-param-reassign
    } = getChildTextNodeAndOffsetFromParentOffset(containerNode, caretStart));
  } else {
    if (containerNode.childNodes.length > 1) {
      console.warn(
        'setCaret() - containerNode has more than one child...',
        containerNode
      );
    }
    const [hopefullyTextNode] = containerNode.childNodes; // eslint-disable-line prefer-destructuring
    if (hopefullyTextNode?.nodeType === DOM_TEXT_NODE_TYPE_ID) {
      textNode = hopefullyTextNode;
    }
  }
  if (textNode) {
    console.info('setCaret textNode ', textNode, ' caretStart ', caretStart);
    // set caret to end of text content
    if (caretStart === -1 || caretStart > textNode.textContent.length) {
      /* eslint-disable-next-line prefer-destructuring, no-param-reassign */
      caretStart = textNode.textContent.length;
    }
    range.setStart(textNode, caretStart);
    sel.addRange(range);
    // scroll caret into view
    scrollToCaretIfOutOfView();
  } else {
    console.warn(
      `setCaret - couldn't find a text node inside of `,
      startNodeId
    );
  }
}

/**
 * given a child node, find the offset in the parent paragraph of the beginning of the child node's textContent
 * NOTE: remember to add the current range offset to this number to get correct offset of all paragraph content
 * @param formattingNode
 * @param paragraph
 * @returns {number}
 */
function getParagraphContentOffset(formattingNodeArg, paragraph) {
  let formattingNode = formattingNodeArg;
  if (formattingNode === paragraph) {
    return 0;
  }
  while (formattingNode.parentElement !== paragraph) {
    // find the first immediate child of the paragraph - we could be nested inside several formatting tags at this point
    // i.e. for <em><strong><strike>content here</strike></strong></em> - we want the <em> node
    /* eslint-disable-next-line prefer-destructuring */
    formattingNode = formattingNode.parentElement;
  }
  // find the index of the immediate child
  const rangeIdx = Array.prototype.indexOf.call(
    paragraph.childNodes,
    formattingNode
  );
  let offset = 0;
  for (let i = 0; i < rangeIdx; i++) {
    // for each child of the paragraph that precedes our current range - add the length of it's content to the offset
    offset += paragraph.childNodes[i].textContent.length;
  }
  return offset;
}

export function caretIsAtBeginningOfInput() {
  const { activeElement: active } = document;
  return active.tagName === DOM_INPUT_TAG_NAME && active.selectionStart === 0;
}
export function caretIsAtEndOfInput() {
  const { activeElement: active } = document;
  return (
    active.tagName === DOM_INPUT_TAG_NAME &&
    active.selectionStart === active.value.length
  );
}

/**
 * Once formatting is applied to a paragraph, subsequent selections
 * could yield a child formatting element <em>, <strong>, etc. as the
 * Range commonAncestorContainer But, we need to express selections in
 * terms of an offset within the parent (AKA first ancestor with a 'name'
 * attribute) content
 *
 * @return {
 *  caretStart, int
 *  caretEnd, int
 *  startNodeId, string
 *  endNodeId, string // if user has highlighted across > 1 nodes
 * }
 */
export function getHighlightedSelectionOffsets() {
  const range = getRange();
  if (!range) {
    return {};
  }
  const startNode = getFirstAncestorWithId(range.startContainer);
  const endNode = getFirstAncestorWithId(range.endContainer);
  if (startNode === null || endNode === null) {
    return {};
  }

  const { startOffset: rangeStartOffset } = range;
  const { endOffset: rangeEndOffset } = range;
  const startNodeOffset = getParagraphContentOffset(
    range.startContainer,
    startNode
  );
  // add the range offset (position within an inner formatting node) to the offset of
  // all content in the paragraph for where that formatting node starts.  This gives the
  // offset of caret relative to the paragraph content length
  let caretStart = rangeStartOffset + startNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeStartOffset === 1 && cleanText(startNode.textContent).length === 0) {
    caretStart = 0;
  }
  // in consumer code range.collapsed can be checked by caretStart === caretEnd
  const selectionOffsets = {
    caretStart,
    caretEnd: range.collapsed
      ? caretStart
      : cleanText(startNode.textContent).length,
    startNodeId: getNodeId(startNode)
  };
  if (range.collapsed) {
    return selectionOffsets;
  }

  const endNodeOffset = getParagraphContentOffset(range.endContainer, endNode);
  let endNodeCaretEnd = rangeEndOffset + endNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeEndOffset === 1 && cleanText(endNode.textContent).length === 0) {
    endNodeCaretEnd = 0;
  }
  selectionOffsets.caretEnd = endNodeCaretEnd;

  if (startNode === endNode) {
    console.debug('getHighlightedSelectionOffsets SINGLE NODE');
    return selectionOffsets;
  }
  console.debug('getHighlightedSelectionOffsets MULTIPLE NODES');
  selectionOffsets.endNodeId = getNodeId(endNode);
  return selectionOffsets;
}

// this is used to determine whether the caret will leave the current node
// if the user presses the up or down arrow
//
// return array of boolean - caret is at [top, right, bottom, left] of paragraph textContent
export function caretIsOnEdgeOfParagraphText() {
  const range = getRange();
  if (!range || !range.collapsed) {
    return [];
  }
  const currentParagraph = getFirstAncestorWithId(
    range.commonAncestorContainer
  );
  if (!currentParagraph) {
    console.warn("caretIsOnEdgeOfParagraphText can't find node!", range);
    return [];
  }
  const { startOffset: currentChildCaretOffset } = range;
  const currentChildParagraphContentOffset = getParagraphContentOffset(
    range.startContainer,
    currentParagraph
  );

  function compareRangeAndParagraphTopOrBottom(key) {
    const caretRect = range.getBoundingClientRect();
    const paragraphRect = currentParagraph.getBoundingClientRect();
    // if there's less than a caret height left when comparing the range rect to the paragraph rect,
    // we're on the top or bottom line of the paragraph text
    // TODO: this will probably break if adding margin or padding to the paragraph or any formatting <span>s
    return Math.abs(paragraphRect[key] - caretRect[key]) < caretRect.height;
  }
  return [
    compareRangeAndParagraphTopOrBottom('top'),
    currentChildCaretOffset + currentChildParagraphContentOffset ===
      currentParagraph.textContent.length,
    compareRangeAndParagraphTopOrBottom('bottom'),
    currentChildCaretOffset + currentChildParagraphContentOffset === 0
  ];
}

export function isControlKey(code) {
  return [
    KEYCODE_TAB,
    KEYCODE_SHIFT_RIGHT,
    KEYCODE_SHIFT_OR_COMMAND_LEFT,
    KEYCODE_COMMAND_RIGHT,
    KEYCODE_ALT,
    KEYCODE_CTRL,
    KEYCODE_CAPS_LOCK,
    KEYCODE_ENTER,
    KEYCODE_ESC,
    KEYCODE_PAGE_UP,
    KEYCODE_PAGE_DOWN,
    KEYCODE_END,
    KEYCODE_HOME,
    KEYCODE_LEFT_ARROW,
    KEYCODE_UP_ARROW,
    KEYCODE_RIGHT_ARROW,
    KEYCODE_DOWN_ARROW,
    KEYCODE_F1,
    KEYCODE_F2,
    KEYCODE_F3,
    KEYCODE_F4,
    KEYCODE_F5,
    KEYCODE_F6,
    KEYCODE_F7,
    KEYCODE_F8,
    KEYCODE_F9,
    KEYCODE_F10,
    KEYCODE_F11,
    KEYCODE_F12,
    KEYCODE_PRINT_SCREEN
  ].includes(code);
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    // tag.async = true;
    // tag.defer = true;
    tag.onload = resolve;
    tag.onerror = reject;
    tag.src = src;
    const body = document.getElementsByTagName('body')[0];
    body.appendChild(tag);
  });
}
