import { assertValidDomSelectionOrThrow } from '../../common/dom.mjs';
import { getNode } from '@filbert/linked-list';
import {
  contentClean,
  isTextType,
  update,
  insertAfter,
  type,
  getLastInsertId,
  NODE_CONTENT,
  NODE_TYPE,
} from '@filbert/document';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;

  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  // TODO: convert HTML => filbert documentModel
  // const clipboardHtml = clipboardData.getData('text/html');
  let startNode = getNode(documentModel, startNodeId);
  if (!isTextType(startNode)) {
    console.warn(
      `doPaste() - trying to paste into a "${startNode.type}" node is not supported`,
      selectionOffsets,
      clipboardData
    );
    return {};
  }
  const historyLogEntries = [];
  let historyLogEntry;

  // TODO: preserve format of copied text
  const beforeContent = contentClean(startNode);
  const contentLeft = contentClean(startNode).substring(0, caretStart);
  const contentRight = contentClean(startNode).substring(caretStart);
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
    startNode = startNode.set(NODE_CONTENT, updatedContent);
    /*startNode.formatSelections.adjustSelectionOffsetsAndCleanup(
      updatedContent.length,
      beforeContent.length,
      caretStart,
      diffLength
    );*/
    ({ documentModel, historyLogEntry } = update(documentModel, startNode));
    historyLogEntries.push(historyLogEntry);
    return {
      documentModel,
      selectionOffsets: {
        startNodeId,
        caretStart: contentLeft.length + diffLength,
      },
      historyLogEntries,
    };
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
  ({ documentModel, historyLogEntry } = insertAfter(
    documentModel,
    { [NODE_TYPE]: type(startNode), [NODE_CONTENT]: beforeContent },
    leftNodeId
  ));
  historyLogEntries.push(historyLogEntry);
  const rightNodeId = getLastInsertId();
  // now leftNode has 'next_sibling_id' set to rightNode
  // important: 'content' is now contentLeft
  let leftNode = getNode(documentModel, leftNodeId);
  leftNode = leftNode.set(NODE_CONTENT, contentLeft);
  let rightNode = getNode(documentModel, rightNodeId);

  /* TODO: UNIMPLEMENTED 2) if the original selected node can have Selections - move them to the right node if needed
  // NOTE: do this with BEFORE content
  const {
    left,
    right,
  } = leftNode.formatSelections.splitSelectionsAtCaretOffset(caretStart);
  leftNode.formatSelections = left;
  rightNode.formatSelections = right;*/

  // 3) update content with firstLine & lastLine
  leftNode = leftNode.set(NODE_CONTENT, updatedLeftNodeContent);
  rightNode = rightNode.set(NODE_CONTENT, updatedRightNodeContent);

  /* 4) adjust offsets with updated content
  leftNode.formatSelections.adjustSelectionOffsetsAndCleanup(
    updatedLeftNodeContent.length,
    contentLeft.length, // this is before content! takes this as an argument for comparison with now updated content in leftNode
    caretStart,
    firstLine.length
  );
  rightNode.formatSelections.adjustSelectionOffsetsAndCleanup(
    updatedRightNodeContent.length,
    contentRight.length, // before content!
    0,
    lastLine.length
  );*/
  ({ documentModel, historyLogEntry } = update(documentModel, leftNode));
  historyLogEntries.push(historyLogEntry);

  // there are middle lines, insert Paragraphs after "left"
  let prevNodeId = startNodeId;
  while (clipboardLines.length > 0) {
    const currentLine = clipboardLines.shift();
    // skip whitespace only lines TODO: allow in Code sections?
    if (currentLine.trim().length > 0) {
      ({ documentModel, historyLogEntry } = insertAfter(
        documentModel,
        { [NODE_TYPE]: type(leftNode), [NODE_CONTENT]: currentLine },
        prevNodeId
      ));
      historyLogEntries.push(historyLogEntry);
      const nextId = getLastInsertId();
      prevNodeId = nextId;
    }
  }
  // NOTE: rightNode next pointer should be ok, since it was added before "middle" nodes
  ({ documentModel, historyLogEntry } = update(documentModel, rightNode));
  historyLogEntries.push(historyLogEntry);
  return {
    documentModel,
    selectionOffsets: {
      startNodeId: rightNodeId,
      caretStart: lastLine.length,
    },
    historyLogEntries,
  };
}
