import { getNode, head } from '@filbert/linked-list';
import {
  type,
  isLastOfType,
  update,
  insertAfter,
  insertBefore,
  contentOrZeroLengthChar,
  NODE_CONTENT,
  NODE_TYPE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
  getLastInsertId,
  isMetaType,
  setType,
} from '@filbert/document';
import { cleanText } from '@filbert/util';
import { assertValidDomSelectionOrThrow } from '../../common/dom.mjs';

function handleEnterTextType(
  documentModel,
  leftNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let leftNode = getNode(documentModel, leftNodeId);
  let newNodeType = type(leftNode);
  // user hits enter on empty list or code item, and it's the last of type, always convert to P
  // to break out of a list or code section
  if (
    cleanText(contentLeft).length === 0 &&
    cleanText(contentRight).length === 0 &&
    [NODE_TYPE_PRE, NODE_TYPE_LI].includes(newNodeType) &&
    isLastOfType(documentModel, leftNode)
  ) {
    // convert empty sections to a P on enter
    leftNode = setType(leftNode, NODE_TYPE_P);
    let historyLogEntry;
    ({ documentModel, historyLogEntry } = update(documentModel, leftNode));
    return { documentModel, historyLogEntries: [historyLogEntry] };
  }

  const historyLogEntries = [];
  // if user hits enter at beginning of H1 or H2, convert "left" to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentLeft).length === 0
  ) {
    leftNode = setType(leftNode, NODE_TYPE_P);
    let historyLogEntry;
    ({ documentModel, historyLogEntry } = update(documentModel, leftNode));
    historyLogEntries.push(historyLogEntry);
  }
  // if user hits enter at end of H1 or H2, set "right" type to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentRight).length === 0
  ) {
    newNodeType = NODE_TYPE_P;
  }

  let historyLogEntry;
  ({ documentModel, historyLogEntry } = insertAfter(
    documentModel,
    { [NODE_TYPE]: newNodeType, [NODE_CONTENT]: contentRight },
    leftNodeId
  ));
  historyLogEntries.push(historyLogEntry);
  const rightNodeId = getLastInsertId();
  // refresh reference after insert...
  leftNode = getNode(documentModel, leftNodeId).set(NODE_CONTENT, contentLeft);
  const rightNode = getNode(documentModel, rightNodeId);
  /* if the original selected node can have Selections - move them to the right node if needed
  if (leftNode.canHaveSelections()) {
    ({
      left: leftNode.formatSelections,
      right: rightNode.formatSelections,
    } = leftNode.formatSelections.splitSelectionsAtCaretOffset(
      leftNode,
      rightNode,
      caretPosition
    ));
  }*/
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
  ({ documentModel, historyLogEntry } = update(documentModel, leftNode));
  historyLogEntries.push(historyLogEntry);
  ({ documentModel, historyLogEntry } = update(documentModel, rightNode));
  historyLogEntries.push(historyLogEntry);

  return { documentModel, historyLogEntries };
}
/**
 * @returns {selectionOffsets:{}, historyLogEntries}
 */
export function doSplit(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);

  const { caretStart, startNodeId } = selectionOffsets;
  let historyLogEntries = [];
  const startNode = getNode(documentModel, startNodeId);
  if (isMetaType(startNode)) {
    console.debug('doSplit() MetaType');
    // if this meta node is first section in document put the P in front
    const shouldInsertAfter = !head(documentModel).equals(startNode);
    const data = { [NODE_TYPE]: NODE_TYPE_P, [NODE_CONTENT]: '' };
    let historyLogEntry;
    if (shouldInsertAfter) {
      ({ documentModel, historyLogEntry } = insertAfter(
        documentModel,
        data,
        startNodeId
      ));
    } else {
      ({ documentModel, historyLogEntry } = insertBefore(
        documentModel,
        data,
        startNodeId
      ));
    }
    historyLogEntries.push(historyLogEntry);
  } else {
    console.debug('doSplit() TextType', startNodeId, caretStart);
    // split selectedNodeContent at caret
    const selectedNodeContent = contentOrZeroLengthChar(startNode);
    ({ documentModel, historyLogEntries } = handleEnterTextType(
      documentModel,
      startNodeId,
      caretStart,
      selectedNodeContent
    ));
  }

  return {
    documentModel,
    selectionOffsets: { startNodeId: getLastInsertId(), caretStart: 0 },
    historyLogEntries,
  };
}
