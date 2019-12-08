import { NODE_TYPE_P } from '../../../common/constants';
import { cleanText } from '../../../common/utils';
import {
  adjustSelectionOffsetsAndCleanup,
  formatSelections,
  splitSelectionsAtCaretOffset
} from '../selection-helpers';

export function handleBackspaceTextType(documentModel, selectedNodeId) {
  let prevNode = documentModel.getPrevNode(selectedNodeId);
  let prevNodeId = prevNode.get('id');
  // if at beginning of first node, nothing to do
  if (!prevNodeId) {
    return [];
  }
  if (!documentModel.isTextType(prevNodeId)) {
    // delete an empty TextType node
    if (documentModel.getNode(selectedNodeId).get('content').length === 0) {
      documentModel.delete(selectedNodeId);
    }
    return [prevNodeId];
  }
  // optionally handles Selections
  documentModel.mergeParagraphs(prevNodeId, selectedNodeId);
  return [prevNodeId, prevNode.get('content').length];
}

export function handleEnterTextType(
  documentModel,
  selectedNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let selectedNodeType = documentModel.getNode(selectedNodeId).get('type');
  // break out of list if user hits enter on empty last list item
  if (
    cleanText(contentLeft).length === 0 &&
    cleanText(contentRight).length === 0 &&
    documentModel.isLastOfType(selectedNodeId)
  ) {
    // convert empty sections to a P on enter
    return documentModel.update(
      documentModel.getNode(selectedNodeId).set('type', NODE_TYPE_P)
    );
  }

  const rightNodeId = documentModel.insert(
    selectedNodeType,
    selectedNodeId,
    contentRight
  );
  let leftNode = documentModel
    .getNode(selectedNodeId)
    .set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);
  if (documentModel.canHaveSelections(selectedNodeId)) {
    [leftNode, rightNode] = splitSelectionsAtCaretOffset(
      leftNode,
      rightNode,
      caretPosition
    );
  }
  console.info(
    'ENTER "TextType" content left: ',
    contentLeft,
    'content right: ',
    contentRight,
    'left selections: ',
    formatSelections(leftNode),
    'right selections: ',
    formatSelections(rightNode)
  );
  documentModel.update(leftNode);
  documentModel.update(rightNode);
  return rightNodeId;
}

export function handlePasteTextType(
  documentModel,
  selectedNodeId,
  caretPosition,
  clipboardText
) {
  let selectedNode = documentModel.getNode(selectedNodeId);
  const content = selectedNode.get('content') || '';
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  console.info(
    'PASTE - paragraph content: ',
    contentLeft,
    contentRight,
    caretPosition,
    clipboardText
  );
  const updatedContent = `${contentLeft}${clipboardText}${contentRight}`;
  const diffLength = clipboardText.length;
  selectedNode = selectedNode.set('content', updatedContent);
  selectedNode = adjustSelectionOffsetsAndCleanup(
    selectedNode,
    content,
    caretPosition,
    diffLength
  );
  documentModel.update(selectedNode);
  return [selectedNodeId, contentLeft.length + clipboardText.length];
}
