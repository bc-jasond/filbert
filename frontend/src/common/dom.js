import { NODE_TYPE_SECTION_CONTENT, NODE_TYPE_SECTION_H1 } from './constants';

export function setCaret(nodeId, offset = -1) {
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
  const textNode = Array.prototype.reduce.call(
    containerNode.childNodes,
    (acc, child) => acc || (child.nodeType === 3 ? child : null),
    null
  );
  if (textNode) {
    console.info('setCaret textNode ', textNode, ' offset ', offset);
    // set caret to end of text content
    range.setEnd(textNode, offset === -1 ? textNode.textContent.length : offset);
  } else {
    // set caret to last child - TODO: make recursive to find text node?
    range.setEnd(containerNode, offset === -1 ? containerNode.textContent.length : offset);
  }
  
  range.collapse();
  sel.addRange(range);
}

export function getRange() {
  const sel = window.getSelection();
  if (sel.rangeCount < 1) {
    return;
  }
  return sel.getRangeAt(0);
}

export function getCaretNode() {
  const range = getRange();
  if (!range) {
    return;
  }
  let { commonAncestorContainer } = range;
  if (commonAncestorContainer.nodeType > 1) {
    return commonAncestorContainer.parentElement
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
  return range.startOffset;
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