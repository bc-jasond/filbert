import { getNodeId } from '../../../common/dom';
import { handlePasteTextType } from './handle-text-type';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  const [
    [caretPositionStart, _, selectedNode],
  ] = selectionOffsets;
  
  if (!selectedNode) {
    return [];
  }
  const selectedNodeId = getNodeId(selectedNode);
  
  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  
  if (!documentModel.isTextType(selectedNodeId)) {
    console.warn("doPaste() - trying to paste into a MetaType node is not supported", selectionOffsets, clipboardData)
    return;
  }
  return handlePasteTextType(documentModel, selectedNodeId, caretPositionStart, clipboardText);
}
