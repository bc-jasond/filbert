/* eslint-disable import/prefer-default-export */
import { assertValidDomSelectionOrThrow } from '../../common/dom';
import { deleteContentRange } from '../../common/utils';
import { getFirstNode } from '@filbert/document';
import { adjustSelectionOffsetsAndCleanup } from '@filbert/selection';
import { getLastInsertedNodeIdFromHistory } from '@filbert/history';

// returns a nodeId for node deleted, false for node updated
function updateNode(documentModel, diffLength, nodeId, startIdx) {
  let node = documentModel.getNode(nodeId);
  const content = node.get('content', '');
  /* TODO: delete node under if all content has been highlighted
  if (startIdx === 0 && diffLength >= content.length) {
    return documentModel.deleteNode(node);
  } */
  // only some of endNode's content has been selected, delete that content
  node = node.set('content', deleteContentRange(content, startIdx, diffLength));
  node = adjustSelectionOffsetsAndCleanup(
    node,
    content,
    startIdx + diffLength,
    // -1 for "regular" backspace to delete 1 char
    diffLength === 0 ? -1 : -diffLength
  );
  return documentModel.update(node);
}

function buildDeleteHistory(
  documentModel,
  { startNodeId, caretStart, endNodeId, caretEnd }
) {
  const historyState = [];
  // TODO: make this step last, aka orphan these nodes first
  // if there are completely highlighted nodes in the middle of the selection - just delete them
  if (endNodeId) {
    const middle = documentModel.getNodesBetween(startNodeId, endNodeId);
    console.info('doDelete() - middle nodes', middle);
    middle.forEach((node) => {
      historyState.push(...documentModel.deleteNode(node));
    });
  }

  /**
   * the selection spans more than one node
   * 1 - delete the highlighted text
   * 2 - set the currentNodeId to the endNode
   * 3 - no "structural" updates for delete operations as part of other Commands
   */
  // default the selectedNode to "startNode" - it can change to endNode below
  let selectedNodeId = startNodeId;
  let didDeleteEndNode = false;
  if (endNodeId) {
    // all of the endNode's content has been selected, delete it and set the selectedNodeId to the next sibling
    // end diff length is caretEnd - 0 (implied caretStart for the end node)
    if (caretEnd > 0) {
      historyState.push(...updateNode(documentModel, caretEnd, endNodeId, 0));
      selectedNodeId = getLastInsertedNodeIdFromHistory(historyState);
    }
    didDeleteEndNode = selectedNodeId !== endNodeId;
  }

  const startNodeMap = documentModel.getNode(startNodeId);
  const startNodeContent = startNodeMap.get('content');

  // if there's an endNodeId - startNode has been selected from caretStart through the end
  const startDiffLength =
    (endNodeId ? startNodeContent.length : caretEnd) - caretStart;

  return {
    didDeleteEndNode,
    selectedNodeId,
    startNodeContent,
    startDiffLength,
    historyState,
  };
}

export function doDeleteMetaType(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  // eslint-disable-next-line prefer-const
  let { startNodeId } = selectionOffsets;
  console.info('doDeleteMetaType()', selectionOffsets);

  // if Meta Type
  if (!documentModel.isMetaType(startNodeId)) {
    throw new Error(
      `Expecting MetaType node\n${JSON.stringify(selectionOffsets, null, 2)}`
    );
  }
  const wasFirstNodeInDocument =
    getFirstNode(documentModel.getNodes()).get('id') === startNodeId;
  const prevNodeId = wasFirstNodeInDocument
    ? getFirstNode(documentModel.getNodes()).get('id')
    : documentModel.getPrevNode(startNodeId).get('id');
  const historyState = documentModel.deleteNode(
    documentModel.getNode(startNodeId)
  );

  return {
    historyState,
    executeSelectionOffsets: {
      startNodeId: prevNodeId,
      caretStart:
        wasFirstNodeInDocument || documentModel.isMetaType(prevNodeId) ? 0 : -1,
    },
  };
}

/**
 *
 * @param documentModel DocumentModel
 * @param caretStart
 * @param caretEnd
 * @param startNodeId
 * @param endNodeId
 * @returns {{}|{startNodeId: *, caretStart: number}|{startNodeId: *, caretStart: *}}
 *
 * This one does the delete operation AND commits it as an atomic operation (aka adds a history entry)
 */
export function doDelete(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  // eslint-disable-next-line prefer-const
  let { caretStart, startNodeId, endNodeId } = selectionOffsets;
  console.info('doDelete()', selectionOffsets);

  /**
   * Backspace scenarios:
   *
   * 1) caret is collapsed OR
   * 2) caret highlights 1 or more characters
   * 3) caretStart === 0
   * 4) caretEnd === selectedNodeMap.get('content').length
   * 5) caret start and end nodes are different (multi-node selection)
   * 6) there are middle nodes (this is easy, just delete them)
   * 7) merge (heal) content from two different nodes
   * 8) startNode is completely selected
   * 9) endNode is completely selected
   * 10) startNode and endNode are the same type
   */
  const buildDeleteResult = buildDeleteHistory(documentModel, selectionOffsets);
  const { didDeleteEndNode, startDiffLength, historyState } = buildDeleteResult;
  let { selectedNodeId } = buildDeleteResult;

  const getReturnPayload = (executeSelectionOffsets) => {
    return { executeSelectionOffsets, historyState };
  };

  // edge case where user selects from end of line (no selected chars in first line) through a following line (didDeleteEndNode)
  if (startDiffLength === 0 && didDeleteEndNode) {
    return getReturnPayload({
      startNodeId,
      caretStart,
    });
  }

  // NOTE: need to distinguish between collapsed caret backspace and highlight 1 char backspace
  //  the former removes a character behind the caret and the latter removes one in front...
  historyState.push(
    ...updateNode(documentModel, startDiffLength, startNodeId, caretStart)
  );
  // getLastExecuteId == undefined means user selected and deleted all text in the node
  selectedNodeId = getLastInsertedNodeIdFromHistory(historyState);

  // if we deleted the first node in the document, use the node that documentModel.deleteNode() returns
  if (selectedNodeId !== startNodeId) {
    return getReturnPayload({
      startNodeId: selectedNodeId,
      caretStart: -1,
    });
  }

  // After updating or deleting start/middle/end nodes - are we done (return here)? Or do we need to merge nodes?
  // We're done if the user deleted the end node:
  if (!endNodeId || didDeleteEndNode || startDiffLength === 0) {
    return getReturnPayload({
      startNodeId: selectedNodeId,
      // startDiffLength === 0 means a collapsed caret backspace, decrement the caret position by 1
      caretStart: startDiffLength === 0 ? caretStart - 1 : caretStart,
    });
  }

  // if we're here, the end node needs to be merged into the start node
  return getReturnPayload({ startNodeId: endNodeId, caretStart: 0 });
}

/**
 * MERGING NODES AFTER DELETE...
 *
 *  UPDATE: immutablejs has helped make this situation more predictable but,
 *  it still isn't conducive to an undo/redo workflow, so leaving the TODO
 *
 *  UPDATE 2: this is a lot more stable after grouping handlers by Node Types.
 *  Splitting out the "DocumentModel" and the "HistoryManager" concerns will help enable undo/redo history.
 *  This will all be revisited during undo/redo.
 *
 *  UPDATE 3: wow, so much easier using a linked list data structure to represent the document, le sigh 🤦‍♀️
 */
export function doMerge(documentModel, selectionOffsets) {
  assertValidDomSelectionOrThrow(selectionOffsets);
  // eslint-disable-next-line prefer-const
  let { caretStart, startNodeId } = selectionOffsets;
  const selectedNodeId = startNodeId;
  const historyState = [];
  const getReturnPayload = (executeSelectionOffsets) => {
    return { executeSelectionOffsets, historyState };
  };

  if (documentModel.isMetaType(selectedNodeId)) {
    /* eslint-disable-next-line no-param-reassign */
    startNodeId = documentModel.getPrevNode(selectedNodeId).get('id');
    // focus end of previous node
    /* eslint-disable-next-line no-param-reassign */
    caretStart = -1;
    historyState.push(
      ...documentModel.deleteNode(documentModel.getNode(selectedNodeId))
    );
    return getReturnPayload({ startNodeId, caretStart });
  }
  /* eslint-disable-next-line no-param-reassign */
  const prevNode = documentModel.getPrevNode(selectedNodeId);
  const prevNodeId = prevNode.get('id');
  // if at beginning of first node, nothing to do
  if (!prevNodeId) {
    return getReturnPayload({ startNodeId: selectedNodeId });
  }
  if (!documentModel.isTextType(prevNodeId)) {
    // delete an empty TextType node
    const maybeEmptyNode = documentModel.getNode(selectedNodeId);
    if (maybeEmptyNode.get('content').length === 0) {
      historyState.push(...documentModel.deleteNode(maybeEmptyNode));
    }
    return getReturnPayload({ startNodeId: prevNodeId, caretStart: 0 });
  }
  // optionally merges Selections
  historyState.push(
    ...documentModel.mergeParagraphs(prevNodeId, selectedNodeId)
  );
  return getReturnPayload({
    startNodeId: prevNodeId,
    caretStart: prevNode.get('content').length,
  });
}
