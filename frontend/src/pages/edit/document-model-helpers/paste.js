import { handlePasteTextType } from './handle-text-type';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  const [[caretPositionStart, _, selectedNodeId]] = selectionOffsets;

  if (!selectedNodeId) {
    return [];
  }

  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');

  if (!documentModel.isTextType(selectedNodeId)) {
    console.warn(
      'doPaste() - trying to paste into a MetaType node is not supported',
      selectionOffsets,
      clipboardData
    );
    return [];
  }
  return handlePasteTextType(
    documentModel,
    selectedNodeId,
    caretPositionStart,
    clipboardText
  );
}
