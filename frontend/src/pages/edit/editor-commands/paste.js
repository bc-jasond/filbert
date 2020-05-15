/* eslint-disable import/prefer-default-export */
import { assertValidDomSelectionOrThrow } from '../../../common/dom';
import {
  adjustSelectionOffsetsAndCleanup,
  splitSelectionsAtCaretOffset,
} from '../selection-helpers';
import { getLastExecuteIdFromHistory } from '../history-manager';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;

  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  // TODO: convert HTML => filbert documentModel
  // const clipboardHtml = clipboardData.getData('text/html');

  if (!documentModel.isTextType(startNodeId)) {
    console.warn(
      `doPaste() - trying to paste into a "${documentModel
        .getNode(startNodeId)
        .get('type')}" node is not supported`,
      selectionOffsets,
      clipboardData
    );
    return {};
  }

  const historyState = [];
  const getReturnPayload = (executeSelectionOffsets) => {
    return { executeSelectionOffsets, historyState };
  };

  // TODO: preserve format of copied text
  let selectedNode = documentModel.getNode(startNodeId);
  const content = selectedNode.get('content') || '';
  const contentLeft = content.substring(0, caretStart);
  const contentRight = content.substring(caretStart);
  console.info(
    'PASTE - paragraph content: ',
    contentLeft,
    contentRight,
    caretStart,
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
      caretStart,
      diffLength
    );
    historyState.push(...documentModel.update(selectedNode));
    return getReturnPayload({
      startNodeId,
      caretStart: contentLeft.length + diffLength,
    });
  }
  // MULTI LINE PASTE
  // NOTE: the order of operations is important here
  console.info('PASTE: multi-line');
  const firstLine = clipboardLines.shift();
  const lastLine = clipboardLines.pop();
  const leftNodeId = startNodeId;
  // add 'lastLine' content to beginning of "right"
  const updatedRightNodeContent = `${lastLine}${contentRight}`;
  // add 'firstLine' content to end of "left"
  const updatedLeftNodeContent = `${contentLeft}${firstLine}`;
  // TODO: this is largely copied from handleEnterTextType() above, maybe split the shared code into a helper?
  // NOTE: rightNode insert (last before first) so that leftNode gets updated with a next_sibling_id
  // 1) insert a new node (rightNode) for 'lastLine' - using BEFORE content
  historyState.push(
    ...documentModel.insert(selectedNode.get('type'), leftNodeId, contentRight)
  );
  const rightNodeId = getLastExecuteIdFromHistory(historyState);
  // now leftNode has 'next_sibling_id' set to rightNode
  // important: 'content' is now contentLeft
  let leftNode = documentModel.getNode(leftNodeId).set('content', contentLeft);
  let rightNode = documentModel.getNode(rightNodeId);

  // 2) if the original selected node can have Selections - move them to the right node if needed
  // NOTE: do this with BEFORE content
  ({ leftNode, rightNode } = splitSelectionsAtCaretOffset(
    leftNode,
    rightNode,
    caretStart
  ));

  // 3) update content with firstLine & lastLine
  leftNode = leftNode.set('content', updatedLeftNodeContent);
  rightNode = rightNode.set('content', updatedRightNodeContent);

  // 4) adjust offsets with updated content
  leftNode = adjustSelectionOffsetsAndCleanup(
    leftNode,
    contentLeft, // this is before content! takes this as an argument for comparison with now updated content in leftNode
    caretStart,
    firstLine.length
  );
  rightNode = adjustSelectionOffsetsAndCleanup(
    rightNode,
    contentRight, // before content!
    0,
    lastLine.length
  );
  historyState.push(...documentModel.update(leftNode));

  // there are middle lines, insert Paragraphs after "left"
  let prevNodeId = startNodeId;
  while (clipboardLines.length > 0) {
    const currentLine = clipboardLines.shift();
    // skip whitespace only lines TODO: allow in Code sections?
    if (currentLine.trim().length > 0) {
      historyState.push(
        ...documentModel.insert(leftNode.get('type'), prevNodeId, currentLine)
      );
      const nextId = getLastExecuteIdFromHistory(historyState);
      prevNodeId = nextId;
    }
  }

  historyState.push(...documentModel.update(rightNode));
  return getReturnPayload({
    startNodeId: rightNodeId,
    caretStart: lastLine.length,
  });
}
