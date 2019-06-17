import { NODE_TYPE_SECTION_CONTENT } from './constants';

export function setCaret(nodeId, shouldPlaceAtBeginning = false) {
  const [containerNode] = document.getElementsByName(nodeId);
  if (!containerNode) return;
  // has a text node?
  const sel = window.getSelection();
  sel.removeAllRanges();
  const range = document.createRange();
  if (shouldPlaceAtBeginning) {
    range.setEnd(containerNode, 0);
  } else {
    // find text node, if present
    const textNode = Array.prototype.reduce.call(
      containerNode.childNodes,
      (acc, child) => acc || (child.nodeType === 3 ? child : null),
      null
    );
    if (textNode) {
      // set caret to end of text content
      range.setEnd(textNode, textNode.textContent.length);
    } else {
      // set caret to last child - TODO: make recursive to find text node?
      range.setEnd(containerNode, containerNode.childNodes.length - 1);
    }
  }
  range.collapse();
  sel.addRange(range);
}

export function getCaretNode() {
  const sel = window.getSelection();
  const range = sel.getRangeAt(0)
  let { commonAncestorContainer } = range;
  if (commonAncestorContainer.nodeType > 1) {
    return commonAncestorContainer.parentElement
  }
  if (commonAncestorContainer.dataset.type === NODE_TYPE_SECTION_CONTENT) {
    return commonAncestorContainer.lastChild;
  }
  return commonAncestorContainer;
}

export function getCaretNodeType() {
  const selectedNode = getCaretNode();
  return selectedNode.dataset.type;
}

export function getCaretNodeId() {
  const selectedNode = getCaretNode();
  return selectedNode.getAttribute('name');
}