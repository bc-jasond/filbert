import {
  NODE_TYPE_CONTENT,
  NODE_TYPE_H1,
  NODE_TYPE_P,
  NODE_TYPE_LI,
  DOM_TEXT_NODE_TYPE_ID,
  KEYCODE_TAB,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_COMMAND_RIGHT,
  KEYCODE_CTRL,
  KEYCODE_ALT,
  KEYCODE_CAPS_LOCK,
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
  KEYCODE_PRINT_SCREEN,
  DOM_ELEMENT_NODE_TYPE_ID, NODE_TYPE_ROOT, ROOT_NODE_PARENT_ID,
} from './constants';
 import {cleanText} from "./utils";

let infiniteLoopCount = 0;

export function setCaret(nodeId, offset = -1, shouldFindLastNode = false) {
  const [containerNode] = document.getElementsByName(nodeId);
  if (!containerNode) {
    console.warn('setCaret containerNode NOT FOUND ', nodeId);
    return;
  }
  console.info('setCaret containerNode ', nodeId);
  // has a text node?
  const sel = window.getSelection();
  sel.removeAllRanges();
  const range = document.createRange();
  // find text node, if present
  infiniteLoopCount = 0;
  let textNode;
  if ([NODE_TYPE_P, NODE_TYPE_LI].includes(containerNode.dataset.type)) {
    [textNode, offset] = getChildTextNodeAndOffsetFromParentOffset(containerNode, offset);
  } else {
    const queue = [...containerNode.childNodes];
    while (queue.length) {
      if (infiniteLoopCount++ > 1000) {
        throw new Error('setCaret is Fuera de Control!!!');
      }
      // find first (queue), find last - (stack) yay!
      const current = shouldFindLastNode ? queue.pop() : queue.shift();
      if (current.nodeType === DOM_TEXT_NODE_TYPE_ID) {
        textNode = current;
        break;
      }
      if (current.childNodes.length) {
        queue.push(...current.childNodes);
      }
    }
  }
  if (textNode) {
    console.info('setCaret textNode ', textNode, ' offset ', offset);
    // set caret to end of text content
    let caretOffset = offset;
    if (offset === -1 || offset > textNode.textContent.length) {
      caretOffset = textNode.textContent.length;
    }
    range.setStart(textNode, caretOffset);
    sel.addRange(range);
  } else {
    console.warn(`setCaret - couldn't find a text node inside of `, nodeId);
  }
}

export function getRange() {
  const sel = window.getSelection();
  if (sel.rangeCount < 1) {
    return;
  }
  return sel.getRangeAt(0);
}

function getParagraphContentOffset(formattingNode, paragraph) {
  if (formattingNode === paragraph) {
    return 0;
  }
  while (formattingNode.parentElement !== paragraph) {
    // find the first immediate child of the paragraph - we could be nested inside several formatting tags at this point
    // i.e. for <em><strong><strike>content here</strike></strong></em> - we want the <em> node
    formattingNode = formattingNode.parentElement;
  }
  // find the index of the immediate child
  const rangeIdx = Array.prototype.indexOf.call(paragraph.childNodes, formattingNode);
  let offset = 0;
  for (let i = 0; i < rangeIdx; i++) {
    // for each child of the paragraph that precedes our current range - add the length of it's content to the offset
    offset += paragraph.childNodes[i].textContent.length;
  }
  return offset;
}

function getPathToAncestorByChildIdx(node, ancestor) {
  const path = [];
  let parent = node.parentNode;
  while (node !== ancestor) {
    // add the node id to make sure we compare apples to apples child index values
    path.push([Array.prototype.indexOf.call(parent.childNodes, node), getNodeId(parent)]);
    parent = parent.parentNode;
    node = node.parentNode;
  }
  path.push([0, ROOT_NODE_PARENT_ID]); // make ancestor's index always 0 since it acts as a root node
  return path.reverse();
}

function getAllChildIdsForNode(node) {
  const ids = [];
  const queue = [node];
  while (queue.length) {
    const current = queue.shift();
    const id = getNodeId(current);
    if (!id) {
      continue;
    }
    ids.push(id);
    queue.push(...current.childNodes)
  }
  return ids;
}

/**
 * 1) find path (array of childNodes indeces for each level of the tree) for ancestor -> startNode
 * 2) find path for ancestor -> endNode
 * 3) use DFS bounding inside start & end indeces for each level
 * 4) returned ids list will contain all "completely highlighted" nodes
 */
function getAllNodesWithIdsBetweenTwoNodes(startNode, endNode, commonAncestor) {
  const nodes = [];
  // commonAncestor will be a Section, an OL or Root
  const startPath = getPathToAncestorByChildIdx(startNode, commonAncestor);
  const endPath = getPathToAncestorByChildIdx(endNode, commonAncestor);
  
  function inner(current, level) {
    const id = getNodeId(current);
    if (!id) {
      return;
    }
    let startIdxBoundary = -1;
    let startIdxAtLevel;
    let startNodeIdAtLevel = 'foo';
    if (Array.isArray(startPath[level])) {
      [startIdxAtLevel, startNodeIdAtLevel] = startPath[level];
    }
  
    let endIdxBoundary = current.parentNode.childNodes.length;
    let endIdxAtLevel;
    let endNodeIdAtLevel = 'bar';
    if (Array.isArray(endPath[level])) {
      [endIdxAtLevel, endNodeIdAtLevel] = endPath[level];
    }
    
    const currentIdx = current === commonAncestor ? 0 : Array.prototype.indexOf.call(current.parentNode.childNodes, current);
    // adjust boundaries depending on which path the current shares a parent with - to make sure we stay "inside the triangle"
    const currentHasSameParentAsStartPath = getNodeId(current.parentNode) === startNodeIdAtLevel;
    const currentHasSameParentAsEndPath = getNodeId(current.parentNode) === endNodeIdAtLevel;
    if (getNodeType(current) === NODE_TYPE_ROOT || (currentHasSameParentAsStartPath && currentHasSameParentAsEndPath)) {
      // children of the same parent - use level indexes, otherwise keep defaults
      startIdxBoundary = startIdxAtLevel;
      endIdxBoundary = endIdxAtLevel;
    } else if (currentHasSameParentAsStartPath) {
      // grab nodes "from startIdx to length"
      startIdxBoundary = startIdxAtLevel;
    } else {
      // grab nodes "from 0 up to endIdx"
      endIdxBoundary = endIdxAtLevel;
    }
    
    // don't recurse if nodes are "outside" the index, however
    // do recurse if currentIdx === startIdx or currentIdx === endIdx
    if (currentIdx < startIdxBoundary || currentIdx > endIdxBoundary) {
      return;
    }
    // use less-than (without equals) to exclude nodes in start or end path
    if (startIdxBoundary < currentIdx && currentIdx < endIdxBoundary) {
      // recursively get all ids for this node
      nodes.push(...getAllChildIdsForNode(current));
      // don't continue outer recursion
      return;
    }
    for (let i = 0; i < current.childNodes.length; i++) {
      inner(current.childNodes[i], level + 1)
    }
  }
  inner(commonAncestor, 0);
  return nodes;
}

/**
 * Once formatting is applied to a paragraph, subsequent selections could yield a child formatting element <em>, <strong>, etc. as the Range commonAncestorContainer
 * But, we need to express selections in terms of an offset within the parent content (AKA first ancestor with a 'name' attribute)
 *
 * @return [
 *  [start, end, nodeId], // starting node & offset
 *  [start, end, nodeId], // *optional list of nodeIds completely enveloped by highlight
 *  [nodeId...],          // *optional ending node & offset, if user has highlighted across > 1 nodes
 * ]
 */
export function getHighlightedSelectionOffsets() {
  const range = getRange();
  if (!range) {
    return [[]];
  }
  const startNode = getFirstAncestorWithId(range.startContainer);
  const endNode = getFirstAncestorWithId(range.endContainer);
  const commonAncestor = range.commonAncestorContainer;
  const rangeStartOffset = range.startOffset;
  const rangeEndOffset = range.endOffset;
  
  if (startNode === null || endNode === null) {
    return [[]];
  }
  
  const startNodeOffset = getParagraphContentOffset(range.startContainer, startNode);
  let startOffset = rangeStartOffset + startNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeStartOffset === 1 && cleanText(startNode.textContent).length === 0) {
    startOffset = 0;
  }
  // in consumer code range.collapsed can be checked by start[0] === start[1]
  const start = [startOffset, range.collapsed ? startOffset : cleanText(startNode.textContent).length, startNode];
  if (range.collapsed) {
    return [start];
  }
  
  const endNodeOffset = getParagraphContentOffset(range.endContainer, endNode);
  let endOffset = rangeEndOffset + endNodeOffset;
  // special case for an empty paragraph with a ZERO_LENGTH_PLACEHOLDER
  if (rangeEndOffset === 1 && cleanText(endNode.textContent).length === 0) {
    endOffset = 0;
  }
  const end = [0, endOffset, endNode];
  
  if (startNode === endNode) {
    start[1] = endOffset;
    console.debug('getHighlightedSelectionOffsets SINGLE NODE');
    return [start];
  }
  
  console.debug('getHighlightedSelectionOffsets MULTIPLE NODES');
  const middle = getAllNodesWithIdsBetweenTwoNodes(startNode, endNode, commonAncestor);
  
  //const selectedTextStart = startNode.textContent.slice(start[0]);
  //const selectedTextEnd = endNode.textContent.slice(0, end[1]);
  return [start, middle, end];
}

/**
 * TODO: When React re-renders after setState() to apply formatting changes, the highlight is lost.
 *  Use this to replace it.
 */
export function replaceHighlightedSelection(startNode, startOffset, endNode, endOffset) {}

/**
 * given an offset in a parent 'paragraph', return a child text node and child offset
 */
export function getChildTextNodeAndOffsetFromParentOffset(parent, parentOffset) {
  let childOffset = parentOffset === -1 ? parent.textContent.length : parentOffset;
  const textNodesOnlyFlattened = [];
  const queue = [...parent.childNodes];
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
    childNode = textNodesOnlyFlattened[i];
    // assume max depth level one for text nodes AKA no tags within tags here for formatting
    if (childNode.textContent.length >= childOffset) {
      break;
    }
    childOffset -= childNode.textContent.length;
  }
  return [childNode, childOffset];
}

export function getFirstAncestorWithId(domNode) {
  if (!domNode) return;
  if (domNode.nodeType === DOM_ELEMENT_NODE_TYPE_ID && domNode.getAttribute('name')) return domNode;
  // walk ancestors until one has a truthy 'name' attribute
  // 'name' === id in the db
  let current = domNode.parentElement;
  while (current && !current.getAttribute('name')) {
    current = current.parentElement;
  }
  return current;
}

export function getNodeType(node) {
  return (node && node.dataset)
    ? node.dataset.type
    : null;
}

export function getNodeId(node) {
  return (node && node.getAttribute)
    ? node.getAttribute('name')
    : null;
}

export function getFirstHeadingContent() {
  const [h1] = document.querySelectorAll(`[data-type='${NODE_TYPE_H1}']`);
  return h1 ? h1.textContent : '';
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
    KEYCODE_PRINT_SCREEN,
  ].includes(code);
}
