/* eslint-disable import/prefer-default-export */
import { Map } from 'immutable';
import {
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
} from '@filbert/document';
import { cleanText, cleanTextOrZeroLengthPlaceholder } from '@filbert/util';
import { getFirstNode } from '@filbert/document';
import {
  formatSelections,
  splitSelectionsAtCaretOffset,
} from '@filbert/selection';
import { assertValidDomSelectionOrThrow } from '../../common/dom';

function handleEnterTextType(
  documentModel,
  leftNodeId,
  caretPosition,
  content
) {
  const contentLeft = content.substring(0, caretPosition);
  const contentRight = content.substring(caretPosition);
  let newNodeType = documentModel.getNode(leftNodeId).get('type');
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

  const historyState = [];
  // if user hits enter at beginning of H1 or H2, convert "left" to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentLeft).length === 0
  ) {
    historyState.push(
      ...documentModel.update(
        documentModel.getNode(leftNodeId).set('type', NODE_TYPE_P)
      )
    );
  }
  // if user hits enter at end of H1 or H2, set "right" type to P
  if (
    [NODE_TYPE_H1, NODE_TYPE_H2].includes(newNodeType) &&
    cleanText(contentRight).length === 0
  ) {
    newNodeType = NODE_TYPE_P;
  }

  historyState.push(
    ...documentModel.insert(newNodeType, leftNodeId, contentRight)
  );
  const rightNodeId = documentModel.getLastInsertId();
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
  // NOTE: "focus node" will be the last history entry
  historyState.push(...documentModel.update(leftNode));
  historyState.push(...documentModel.update(rightNode));

  return historyState;
}
/**
 * @returns {selectionOffsets:{}, historyState}
 */
export function doSplit(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);

  const { caretStart, startNodeId } = selectionOffsets;
  const historyState = [];
  if (documentModel.isMetaType(startNodeId)) {
    console.debug('doSplit() MetaType');
    // if this meta node is first section in document put the P in front
    const shouldInsertAfter =
      getFirstNode(documentModel.getNodes()).get('id') !== startNodeId;
    historyState.push(
      ...documentModel.insert(
        NODE_TYPE_P,
        startNodeId,
        '',
        Map(),
        shouldInsertAfter
      )
    );
  } else {
    console.debug('doSplit() TextType', startNodeId, caretStart);
    // split selectedNodeContent at caret
    const selectedNodeContent = cleanTextOrZeroLengthPlaceholder(
      documentModel.getNode(startNodeId).get('content')
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

  const focusNodeId = documentModel.getLastInsertId();
  return {
    selectionOffsets: { startNodeId: focusNodeId, caretStart: 0 },
    historyState,
  };
}
