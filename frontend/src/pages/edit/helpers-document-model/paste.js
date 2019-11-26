import { NODE_TYPE_LI, NODE_TYPE_P, NODE_TYPE_PRE } from '../../../common/constants';
import { getNodeId, getNodeType } from '../../../common/dom';
import { handlePasteCode } from '../helpers-by-section-type/handle-code';
import { handlePasteParagraph } from '../helpers-by-section-type/handle-paragraph';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  const [
    [caretPositionStart, _, selectedNode],
  ] = selectionOffsets;
  
  if (!selectedNode) {
    return [];
  }
  const selectedNodeType = getNodeType(selectedNode);
  const selectedNodeId = getNodeId(selectedNode);
  
  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  
  let focusNodeId;
  let focusIdx = caretPositionStart;
  switch (selectedNodeType) {
    case NODE_TYPE_PRE: {
      [
        focusNodeId,
        focusIdx,
      ] = handlePasteCode(documentModel, selectedNodeId, caretPositionStart, clipboardText);
      break;
    }
    case NODE_TYPE_LI: // fall-through
    case NODE_TYPE_P: {
      [
        focusNodeId,
        focusIdx,
      ] = handlePasteParagraph(documentModel, selectedNodeId, caretPositionStart, clipboardText);
    }
    default: { /*NOOP*/
    }
  }
  return [focusNodeId, focusIdx];
}
