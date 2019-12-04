import { List, Map } from 'immutable';

import {
  NODE_TYPE_OL,
  NODE_TYPE_P, NODE_TYPE_CODE, NODE_TYPE_CONTENT,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_SPACER, NODE_TYPE_LI
} from '../../../common/constants';
import { cleanText } from '../../../common/utils';
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
    // delete an empty TextType node
    if (documentModel.getNode(selectedNodeId).get('content').length === 0) {
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

export function titleToParagraph(documentModel, selectedNodeId) {
  const titleSection = documentModel.getNode(selectedNodeId);
  // change title section to content section
  documentModel.update(titleSection.set('type', NODE_TYPE_CONTENT));
  // insert paragraph
  return documentModel.insert(selectedNodeId, NODE_TYPE_P, 0, titleSection.get('content'));
}

export function paragraphToTitle(documentModel, selectedNodeId, sectionType) {
  const paragraph = documentModel.getNode(selectedNodeId);
  const section = documentModel.getSection(selectedNodeId);
  const sectionId = section.get('id');
  const content = paragraph.get('content');
  const paragraphWasOnlyChild = documentModel.isOnlyChild(selectedNodeId);
  const paragraphIdx = documentModel
    .getChildren(sectionId)
    .findIndex(s => s.get('id') === selectedNodeId);
  const sectionIdx = documentModel
    .getChildren(documentModel.rootId)
    .findIndex(s => s.get('id') === sectionId);
  
  documentModel.delete(selectedNodeId);
  // non-split scenario - just update existing section
  if (paragraphWasOnlyChild) {
    return documentModel.update(section
      .set('type', sectionType)
      .set('content', content)
    );
  }
  const sectionOffset = documentModel.splitSectionForFormatChange(sectionId, paragraphIdx);
  return documentModel.insertSection(sectionType, sectionIdx + sectionOffset, content);
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