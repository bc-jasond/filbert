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
  const prevNode = documentModel.getPrevNode(selectedNodeId);
  const prevNodeId = prevNode.get('id');
  // if at beginning of first node, nothing to do
  if (!prevNodeId) {
    return { focusNodeId: selectedNodeId };
  }
  if (!documentModel.isTextType(prevNodeId)) {
    // delete an empty TextType node
    if (documentModel.getNode(selectedNodeId).get('content').length === 0) {
      documentModel.delete(selectedNodeId);
    }
    return { focusNodeId: prevNodeId };
  }
  // optionally handles Selections
  documentModel.mergeParagraphs(prevNodeId, selectedNodeId);
  return {
    focusNodeId: prevNodeId,
    caretOffset: prevNode.get('content').length
  };
}

export function handleEnterTextType(
  documentModel,
  leftNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let newNodeType = documentModel.getNode(leftNodeId).get('type');
  let didConvertLeftNodeToP = false;
  // user hits enter on empty list or code item, and it's the last of type, always convert to P
  // to break out of a list or code section
  if (
    cleanText(contentLeft).length === 0 &&
    cleanText(contentRight).length === 0 &&
    [NODE_TYPE_PRE, NODE_TYPE_LI].includes(newNodeType) &&
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
    ![NODE_TYPE_P, NODE_TYPE_PRE, NODE_TYPE_LI].includes(newNodeType) &&
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
    ![NODE_TYPE_PRE, NODE_TYPE_LI].includes(newNodeType) &&
    cleanText(contentRight).length === 0
  ) {
    newNodeType = NODE_TYPE_P;
  }

  const rightNodeId = documentModel.insert(
    newNodeType,
    leftNodeId,
    contentRight
  );
  let leftNode = documentModel.getNode(leftNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);
  // if the original selected node can have Selections - move them to the right node if needed
  if (documentModel.canHaveSelections(leftNodeId)) {
    ({ leftNode, rightNode } = splitSelectionsAtCaretOffset(
      leftNode,
      rightNode,
      caretPosition
    ));
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
  const clipboardLines = clipboardText.split('\n');
  if (clipboardLines.length === 1) {
    const updatedContent = `${contentLeft}${clipboardText}${contentRight}`;
    const { length: diffLength } = clipboardText;
    selectedNode = selectedNode.set('content', updatedContent);
    selectedNode = adjustSelectionOffsetsAndCleanup(
      selectedNode,
      content,
      caretPosition,
      diffLength
    );
    documentModel.update(selectedNode);
    return {
      focusNodeId: selectedNodeId,
      caretOffset: contentLeft.length + diffLength
    };
  }
  // doSplit()
  // add 'firstLine' content to end of "left"
  // const firstLine = clipboardLines.shift();
  // add 'lastLine' content to beginning of "right"
  const lastLine = clipboardLines.pop();
  if (clipboardLines.length > 0) {
    // there are middle lines, insert Paragraphs after "left"
  }
  return {
    focusNodeId: 'foo', // right.get('id'),
    caretOffset: lastLine.length
  };
}
