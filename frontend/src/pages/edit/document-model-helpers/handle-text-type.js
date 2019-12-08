import {
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE
} from '../../../common/constants';
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
    return [selectedNodeId];
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
  leftNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let leftNodeType = documentModel.getNode(leftNodeId).get('type');
  let didConvertLeftNodeToP = false;
  // user hits enter on empty list or code item, and it's the last of type, always convert to P
  // to break out of a list or code section
  if (
    cleanText(contentLeft).length === 0 &&
    cleanText(contentRight).length === 0 &&
    [NODE_TYPE_PRE, NODE_TYPE_LI].includes(leftNodeType) &&
    documentModel.isLastOfType(leftNodeId)
  ) {
    // convert empty sections to a P on enter
    return documentModel.update(
      documentModel.getNode(leftNodeId).set('type', NODE_TYPE_P)
    );
  }
  // for all other node types: if user hits enter at beginning of line (always true for MetaType),
  // insert an empty P before
  if (
    ![NODE_TYPE_PRE, NODE_TYPE_LI].includes(leftNodeType) &&
    cleanText(contentLeft).length === 0
  ) {
    didConvertLeftNodeToP = true;
    documentModel.update(
      documentModel.getNode(leftNodeId).set('type', NODE_TYPE_P)
    );
  }
  // for all other node types: if user hits enter at end of line,
  // convert new line to P
  if (
    ![NODE_TYPE_PRE, NODE_TYPE_LI].includes(leftNodeType) &&
    cleanText(contentRight).length === 0
  ) {
    leftNodeType = NODE_TYPE_P;
  }

  const rightNodeId = documentModel.insert(
    leftNodeType,
    leftNodeId,
    contentRight
  );
  let leftNode = documentModel.getNode(leftNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);
  // if the original selected node can have Selections - move them to the right node if needed
  if (documentModel.canHaveSelections(leftNodeId)) {
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
  return didConvertLeftNodeToP ? leftNodeId : rightNodeId;
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
