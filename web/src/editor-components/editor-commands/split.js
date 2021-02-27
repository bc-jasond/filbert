import {
  NODE_CONTENT,
  NODE_TYPE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
} from '@filbert/document';
import { cleanText, cleanTextOrZeroLengthPlaceholder } from '@filbert/util';
import { assertValidDomSelectionOrThrow } from '../../common/dom.mjs';

function handleEnterTextType(
  documentModel,
  leftNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  const leftNode = documentModel.getNode(leftNodeId);
  let newNodeType = leftNode.type;
  // user hits enter on empty list or code item, and it's the last of type, always convert to P
  // to break out of a list or code section
  if (
    cleanText(contentLeft).length === 0 &&
    cleanText(contentRight).length === 0 &&
    [NODE_TYPE_PRE, NODE_TYPE_LI].includes(newNodeType) &&
    leftNode.isLastOfType()
  ) {
    // convert empty sections to a P on enter
    leftNode.type = NODE_TYPE_P;
    return documentModel.update(leftNode);
  }

  const historyState = [];
  // if user hits enter at beginning of H1 or H2, convert "left" to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentLeft).length === 0
  ) {
    leftNode.type = NODE_TYPE_P;
    historyState.push(documentModel.update(leftNode));
  }
  // if user hits enter at end of H1 or H2, set "right" type to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentRight).length === 0
  ) {
    newNodeType = NODE_TYPE_P;
  }

  historyState.push(
    documentModel.insertAfter(
      { [NODE_TYPE]: newNodeType, [NODE_CONTENT]: contentRight },
      leftNodeId
    )
  );
  const rightNodeId = documentModel.lastInsertId;
  leftNode.content = contentLeft;
  const rightNode = documentModel.getNode(rightNodeId);
  // if the original selected node can have Selections - move them to the right node if needed
  if (leftNode.canHaveSelections()) {
    ({
      left: leftNode.formatSelections,
      right: rightNode.formatSelections,
    } = leftNode.formatSelections.splitSelectionsAtCaretOffset(
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
    leftNode.formatSelections,
    'right selections: ',
    rightNode.formatSelections
  );
  // NOTE: "focus node" will be the last history entry
  historyState.push(documentModel.update(leftNode));
  historyState.push(documentModel.update(rightNode));

  return historyState;
}
/**
 * @returns {selectionOffsets:{}, historyState}
 */
export function doSplit(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);

  const { caretStart, startNodeId } = selectionOffsets;
  const historyState = [];
  const startNode = documentModel.getNode(startNodeId);
  if (startNode.isMetaType()) {
    console.debug('doSplit() MetaType');
    // if this meta node is first section in document put the P in front
    const shouldInsertAfter = documentModel.head !== startNode;
    const data = { [NODE_TYPE]: NODE_TYPE_P, [NODE_CONTENT]: '' };
    historyState.push(
      shouldInsertAfter
        ? documentModel.insertAfter(data, startNodeId)
        : documentModel.insertBefore(data, startNodeId)
    );
  } else {
    console.debug('doSplit() TextType', startNodeId, caretStart);
    // split selectedNodeContent at caret
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(
      startNode.content
    );
    historyState.push(
      ...handleEnterTextType(
        documentModel,
        startNodeId,
        caretStart,
        selectedNodeContent
      )
    );
  }

  const focusNodeId = documentModel.lastInsertId;
  return {
    selectionOffsets: { startNodeId: focusNodeId, caretStart: 0 },
    historyState,
  };
}
