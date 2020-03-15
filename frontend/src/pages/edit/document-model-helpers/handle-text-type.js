import {
  NODE_TYPE_H1,
  NODE_TYPE_H2,
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
    return { startNodeId: selectedNodeId };
  }
  if (!documentModel.isTextType(prevNodeId)) {
    // delete an empty TextType node
    const maybeEmptyNode = documentModel.getNode(selectedNodeId);
    if (maybeEmptyNode.get('content').length === 0) {
      documentModel.delete(maybeEmptyNode);
    }
    return { startNodeId: prevNodeId, caretStart: 0 };
  }
  // optionally handles Selections
  documentModel.mergeParagraphs(prevNodeId, selectedNodeId);
  return {
    startNodeId: prevNodeId,
    caretStart: prevNode.get('content').length
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
  // if user hits enter at beginning of H1 or H2, convert "left" to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentLeft).length === 0
  ) {
    didConvertLeftNodeToP = true;
    documentModel.update(
      documentModel.getNode(leftNodeId).set('type', NODE_TYPE_P)
    );
  }
  // if user hits enter at end of H1 or H2, set "right" type to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
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
// TODO: preserve format of copied text
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
  // single line paste
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
      startNodeId: selectedNodeId,
      caretStart: contentLeft.length + diffLength
    };
  }
  // MULTI LINE PASTE
  // NOTE: the order of operations is important here
  console.info('PASTE: multi-line');
  const firstLine = clipboardLines.shift();
  const lastLine = clipboardLines.pop();
  const leftNodeId = selectedNodeId;
  // add 'lastLine' content to beginning of "right"
  const updatedRightNodeContent = `${lastLine}${contentRight}`;
  // add 'firstLine' content to end of "left"
  const updatedLeftNodeContent = `${contentLeft}${firstLine}`;
  // TODO: this is largely copied from handleEnterTextType() above, maybe split the shared code into a helper?
  // NOTE: rightNode insert (last before first) so that leftNode gets updated with a next_sibling_id
  // 1) insert a new node (rightNode) for 'lastLine' - using BEFORE content
  const rightNodeId = documentModel.insert(
    selectedNode.get('type'),
    leftNodeId,
    contentRight
  );
  // now leftNode has 'next_sibling_id' set to rightNode
  // important: 'content' is now contentLeft
  let leftNode = documentModel.getNode(leftNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);

  // 2) if the original selected node can have Selections - move them to the right node if needed
  // NOTE: do this with BEFORE content
  ({ leftNode, rightNode } = splitSelectionsAtCaretOffset(
    leftNode,
    rightNode,
    caretPosition
  ));

  // 3) update content with firstLine & lastLine
  leftNode = leftNode.set('content', updatedLeftNodeContent);
  rightNode = rightNode.set('content', updatedRightNodeContent);

  // 4) adjust offsets with updated content
  leftNode = adjustSelectionOffsetsAndCleanup(
    leftNode,
    contentLeft, // this is before content! takes this as an argument for comparison with now updated content in leftNode
    caretPosition,
    firstLine.length
  );
  rightNode = adjustSelectionOffsetsAndCleanup(
    rightNode,
    contentRight, // before content!
    0,
    lastLine.length
  );
  documentModel.update(leftNode);
  documentModel.update(rightNode);

  // there are middle lines, insert Paragraphs after "left"
  let prevNodeId = selectedNodeId;
  while (clipboardLines.length > 0) {
    const currentLine = clipboardLines.shift();
    // skip whitespace only lines TODO: allow in Code sections?
    if (currentLine.trim().length > 0) {
      const nextId = documentModel.insert(
        leftNode.get('type'),
        prevNodeId,
        currentLine
      );
      prevNodeId = nextId;
    }
  }

  return {
    startNodeId: rightNodeId,
    caretStart: lastLine.length
  };
}
