import {
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  DOM_TEXT_NODE_TYPE_ID,
} from './constants';

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
  const queue = [...containerNode.childNodes];
  while (queue.length) {
    if (infiniteLoopCount++ > 1000) {
      throw new Error('setCaret is Out of Control!!!');
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
  if (textNode) {
    console.info('setCaret textNode ', textNode, ' offset ', offset);
    // set caret to end of text content
    range.setEnd(textNode, offset === -1 ? textNode.textContent.length : offset);
    range.collapse();
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

/**
 * Once formatting is applied to a paragraph, subsequent selections could yield a child formatting element <em>, <strong>, etc. as the Range commonAncestorContainer
 * But, we need to process selections based on the offset within the parent (AKA first ancestor with a 'name' attribute) content
 */
export function getOffsetInParentContent() {
  const range = getRange();
  if (!range || range.collapsed) {
    return;
  }
  const rangeStartOffset = range.startOffset;
  let rangeEndOffset = range.endOffset;
  const selectedText = window.getSelection().toString();
  const paragraph = getCaretNode();
  // range offsets could be relative to a child of the paragraph - but, we need them to be offset based on the paragraph itself
  let rangeNode = range.commonAncestorContainer;
  // if the commonAncestorContainer is the paragraph, multiple childNodes have been selected
  if (rangeNode === paragraph) {
    rangeNode = range.startContainer;
    // use selectedText length here because endOffset will be relative to another child of paragraph
    rangeEndOffset = rangeStartOffset + selectedText.length;
  }
  while (rangeNode.parentElement !== paragraph) {
    // find the first immediate child of the paragraph - we could be nested inside several formatting tags at this point
    rangeNode = rangeNode.parentElement;
  }
  // find the index of the immediate child
  const rangeIdx = Array.prototype.indexOf.call(paragraph.childNodes, rangeNode);
  let offset = 0;
  for (let i = 0; i < rangeIdx; i++) {
    // for each child of the paragraph that precedes our current range - add the length of it's content to the offset
    offset += paragraph.childNodes[i].textContent.length;
  }
  // now we'll have the correct positioning of the selected text inside the paragraph (the node that holds the 'content' saved to the DB) text as a whole no matter what formatting tags have been applied
  return [rangeStartOffset + offset, rangeEndOffset + offset];
}

export function getCaretNode() {
  const range = getRange();
  if (!range) {
    return;
  }
  let { commonAncestorContainer } = range;
  if (commonAncestorContainer.nodeType > 1) {
    let current = commonAncestorContainer.parentElement;
    while (!current.getAttribute('name')) {
      current = current.parentElement;
    }
    return current;
  }
  if (commonAncestorContainer.dataset.type === NODE_TYPE_SECTION_CONTENT) {
    return commonAncestorContainer.lastChild;
  }
  return commonAncestorContainer;
}

export function getCaretOffset() {
  const range = getRange();
  if (!range) {
    return;
  }
  return [range.startOffset, range.endOffset];
}

export function getCaretNodeType() {
  const selectedNode = getCaretNode();
  return selectedNode ? selectedNode.dataset.type : null;
}

export function getCaretNodeId() {
  const selectedNode = getCaretNode();
  return selectedNode ? selectedNode.getAttribute('name') : null;
}

export function getFirstHeadingContent() {
  const [h1] = document.querySelectorAll(`[data-type='${NODE_TYPE_SECTION_H1}']`);
  return h1 ? h1.textContent : '';
}