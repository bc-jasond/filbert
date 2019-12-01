import { KEYCODE_UP_ARROW, NODE_TYPE_ROOT, NODE_TYPE_SPACER } from '../../../common/constants';
import { getNodeId, setCaret } from '../../../common/dom';

/**
 * Move caret if it's somewhere it shouldn't be.
 */
export function moveCaret(documentModel, selectionOffsets, evt) {
  const [
    [_, __, domNode],
  ] = selectionOffsets;
  if (evt.isPropagationStopped() || !domNode) {
    return;
  }
  
  if (domNode.tagName === 'PRE'
    // when clicking on a section, the caret will be on an input in the edit image or quote menu, ignore
    || domNode.dataset.isMenu === 'true' /* TODO: why string? */) {
    // TODO
    return;
  }
  // TODO: clicking on the <article> tag comes back as the header-spacer???
  //  if we're clicking on the document container, focus the end of the last node
  if (domNode.id === 'header-spacer') {
    setCaret(documentModel.rootId, -1, true);
    return;
  }
  const selectedNodeId = getNodeId(domNode);
  const selectedNodeMap = documentModel.getNode(selectedNodeId);
  if (!selectedNodeMap.get('id')) {
    console.warn('CARET no node, bad selection: ', domNode);
    return;
  }
  if (selectedNodeMap.get('type') === NODE_TYPE_SPACER) {
    evt.stopPropagation();
    evt.preventDefault();
    const shouldFocusOnPrevious = evt.keyCode === KEYCODE_UP_ARROW;
    const focusNodeId = shouldFocusOnPrevious
      ? documentModel.getPreviousFocusNodeId(selectedNodeId)
      : documentModel.getNextFocusNodeId(selectedNodeId);
    setCaret(focusNodeId, -1, shouldFocusOnPrevious);
  } else if (selectedNodeMap.get('type') === NODE_TYPE_ROOT) {
    evt.stopPropagation();
    evt.preventDefault();
    setCaret(documentModel.getNextFocusNodeId(selectedNodeId));
  }
}
