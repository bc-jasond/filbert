import { assertValidDomSelectionOrThrow } from '../../common/dom.mjs';
import { NODE_CONTENT, NODE_TYPE } from '@filbert/document';

export function doPaste(documentModel, selectionOffsets, clipboardData) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  const { caretStart, startNodeId } = selectionOffsets;

  // split selectedNodeContent at caret
  const clipboardText = clipboardData.getData('text/plain');
  // TODO: convert HTML => filbert documentModel
  // const clipboardHtml = clipboardData.getData('text/html');
  const startNode = documentModel.getNode(startNodeId);
  if (!startNode.isTextType()) {
    console.warn(
      `doPaste() - trying to paste into a "${startNode.type}" node is not supported`,
      selectionOffsets,
      clipboardData
    );
    return {};
  }
  const historyState = [];

  // TODO: preserve format of copied text
  const beforeContent = startNode.content;
  const contentLeft = startNode.content.substring(0, caretStart);
  const contentRight = startNode.content.substring(caretStart);
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
    startNode.content = updatedContent;
    startNode.formatSelections.adjustSelectionOffsetsAndCleanup(
      updatedContent.length,
      beforeContent.length,
      caretStart,
      diffLength
    );
    historyState.push(documentModel.update(startNode));
    return {
      selectionOffsets: {
        startNodeId,
        caretStart: contentLeft.length + diffLength,
      },
      historyState,
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
  historyState.push(
    documentModel.insertAfter(
      { [NODE_TYPE]: startNode.type, [NODE_CONTENT]: beforeContent },
      leftNodeId
    )
  );
  const rightNodeId = documentModel.lastInsertId;
  // now leftNode has 'next_sibling_id' set to rightNode
  // important: 'content' is now contentLeft
  const leftNode = documentModel.getNode(leftNodeId);
  leftNode.content = contentLeft;
  const rightNode = documentModel.getNode(rightNodeId);

  // 2) if the original selected node can have Selections - move them to the right node if needed
  // NOTE: do this with BEFORE content
  const {
    left,
    right,
  } = leftNode.formatSelections.splitSelectionsAtCaretOffset(caretStart);
  leftNode.formatSelections = left;
  rightNode.formatSelections = right;

  // 3) update content with firstLine & lastLine
  leftNode.content = updatedLeftNodeContent;
  rightNode.content = updatedRightNodeContent;

  // 4) adjust offsets with updated content
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
  );
  historyState.push(documentModel.update(leftNode));

  // there are middle lines, insert Paragraphs after "left"
  let prevNodeId = startNodeId;
  while (clipboardLines.length > 0) {
    const currentLine = clipboardLines.shift();
    // skip whitespace only lines TODO: allow in Code sections?
    if (currentLine.trim().length > 0) {
      historyState.push(
        documentModel.insertAfter(
          { [NODE_TYPE]: leftNode.type, [NODE_CONTENT]: currentLine },
          prevNodeId
        )
      );
      const nextId = documentModel.lastInsertId;
      prevNodeId = nextId;
    }
  }

  historyState.push(documentModel.update(rightNode));
  return {
    selectionOffsets: {
      startNodeId: rightNodeId,
      caretStart: lastLine.length,
    },
    historyState,
  };
}
