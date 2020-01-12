/* eslint-disable import/prefer-default-export */
import { handlePasteTextType } from './handle-text-type';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  const { caretStart, startNodeId } = selectionOffsets;

  if (!startNodeId) {
    return {};
  }

  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  // TODO: convert HTML => filbert documentModel
  // const clipboardHtml = clipboardData.getData('text/html');

  if (!documentModel.isTextType(startNodeId)) {
    console.warn(
      'doPaste() - trying to paste into a MetaType node is not supported',
      selectionOffsets,
      clipboardData
    );
    return {};
  }
  return handlePasteTextType(
    documentModel,
    startNodeId,
    caretStart,
    clipboardText
  );
}
