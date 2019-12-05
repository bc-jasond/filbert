import {
  NODE_TYPE_P,
  NODE_TYPE_SPACER,
} from '../../../common/constants';
import { cleanText } from '../../../common/utils';
import DocumentModel from '../document-model';
import {
  adjustSelectionOffsetsAndCleanup,
  formatSelections,
  splitSelectionsAtCaretOffset
} from '../selection-helpers';

export function handleBackspaceTextType(documentModel, selectedNodeId) {
  const current = documentModel.getNode(selectedNodeId);
  let prevNode = documentModel.getPrevNode(selectedNodeId);
  // if at beginning of first node, nothing to do
  if (!prevNode.get('id')) {
    return [];
  }
  // delete a spacer?
  while (prevNode.get('type') === NODE_TYPE_SPACER) {
    current;
    const prevNodeId = prevNode.get('id');
    prevNode = documentModel.getPrevNode(prevNode.get('id'));
    documentModel.delete(prevNodeId);
    // might have had a spacer as a first section or delete up to a MetaType node
    if (!prevNode.get('id')) {
      return [prevNode.get('id')];
    }
  }
  if (!documentModel.isTextType(prevNode.get('id'))) {
    // delete an empty TextType node if it's not the last node in the document
    if (documentModel.getNode(selectedNodeId).get('content').length === 0 && DocumentModel.getLastNode(documentModel.nodesById).get('id') !== selectedNodeId) {
      documentModel.delete(selectedNodeId);
    }
    return [prevNode.get('id')];
  }
  // optionally handles Selections
  documentModel.mergeParagraphs(prevNode.get('id'), selectedNodeId)
  return [prevNode.get('id'), prevNode.get('content').length];
}

export function handleEnterTextType(documentModel, selectedNodeId, caretPosition, content) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let selectedNodeType = documentModel.getNode(selectedNodeId).get('type');
  // break out of list if user hits enter on empty last list item
  if (cleanText(contentLeft).length === 0
    && cleanText(contentRight).length === 0
    && documentModel.isLastOfType(selectedNodeId)) {
      // convert empty sections to a P on enter
      return documentModel.update(documentModel.getNode(selectedNodeId).set('type', NODE_TYPE_P))
  }
  
  const rightNodeId = documentModel.insert(selectedNodeType, selectedNodeId, contentRight);
  let leftNode = documentModel.getNode(selectedNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);
  if (documentModel.canHaveSelections(selectedNodeId)) {
    [leftNode, rightNode] = splitSelectionsAtCaretOffset(leftNode, rightNode, caretPosition);
  }
  console.info('ENTER "TextType" content left: ', contentLeft, 'content right: ', contentRight, 'left selections: ', formatSelections(leftNode), 'right selections: ', formatSelections(rightNode));
  documentModel.update(leftNode);
  documentModel.update(rightNode);
  return rightNodeId;
}

export function handlePasteTextType(documentModel, selectedNodeId, caretPosition, clipboardText) {
  let selectedNode = documentModel.getNode(selectedNodeId);
  const content = selectedNode.get('content') || '';
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  console.info('PASTE - paragraph content: ', contentLeft, contentRight, caretPosition, clipboardText);
  const updatedContent = `${contentLeft}${clipboardText}${contentRight}`;
  const diffLength = clipboardText.length;
  selectedNode = selectedNode.set('content', updatedContent);
  selectedNode = adjustSelectionOffsetsAndCleanup(selectedNode, content, caretPosition, diffLength);
  documentModel.update(selectedNode);
  return [selectedNodeId, contentLeft.length + clipboardText.length];
}