/* eslint-disable import/prefer-default-export */
import { deleteContentRange } from '../../../common/utils';
import { handleBackspaceTextType } from './handle-text-type';
import { adjustSelectionOffsetsAndCleanup } from '../selection-helpers';

/**
 */
export function doDelete(
  documentModel,
  { caretStart, caretEnd, startNodeId, endNodeId }
) {
  // returns a nodeId for node deleted, false for node updated
  function deleteOrUpdateNode(diffLength, nodeId, startIdx) {
    let node = documentModel.getNode(nodeId);
    const content = node.get('content', '');
    if (
      documentModel.isMetaType(nodeId) ||
      (startIdx === 0 && diffLength >= content.length)
    ) {
      return documentModel.delete(node);
    }
    // only some of endNode's content has been selected, delete that content
    node = node.set(
      'content',
      deleteContentRange(content, startIdx, diffLength)
    );
    node = adjustSelectionOffsetsAndCleanup(
      node,
      content,
      startIdx + diffLength,
      // -1 for "regular" backspace to delete 1 char
      diffLength === 0 ? -1 : -diffLength
    );
    return documentModel.update(node);
  }
  if (startNodeId === 'null' || !startNodeId) {
    console.warn('doDelete() bad selection, no id ', startNodeId);
    return {};
  }

  console.info('doDelete()', caretStart, caretEnd, startNodeId, endNodeId);
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

  // if there are completely highlighted nodes in the middle of the selection - just delete them
  if (endNodeId) {
    const middle = documentModel.getNodesBetween(startNodeId, endNodeId);
    console.info('doDelete() - middle nodes', middle);
    middle.forEach(node => {
      documentModel.delete(node);
    });
  }

  /**
   * the selection spans more than one node
   * 1 - delete the highlighted text
   * 2 - set the currentNodeId to the endNode
   * 3 - set flag to continue to "structural" updates below.  This will heal endNode and startNode
   */
  // default the selectedNode to "startNode" - it can change to endNode below
  let selectedNodeId = startNodeId;
  let didDeleteEndNode = false;
  if (endNodeId) {
    // all of the endNode's content has been selected, delete it and set the selectedNodeId to the next sibling
    // end diff length is caretEnd - 0 (implied caretStart for the end node)
    if (caretEnd > 0) {
      selectedNodeId = deleteOrUpdateNode(caretEnd, endNodeId, 0);
    }
    didDeleteEndNode = selectedNodeId !== endNodeId;
  }

  const startNodeMap = documentModel.getNode(startNodeId);
  const startNodeContent = startNodeMap.get('content');

  // if there's an endNodeId - startNode has been selected from caretStart through the end
  const startDiffLength =
    (endNodeId ? startNodeContent.length : caretEnd) - caretStart;
  if (
    // collapsed caret, user hit backspace anywhere after the beginning - "regular" backspace
    (caretStart > 0 && startNodeContent) ||
    // highlighted selection
    startDiffLength > 0
  ) {
    //
    // NOTE: need to distinguish between collapsed caret backspace and highlight 1 char backspace
    //  the former removes a character behind the caret and the latter removes one in front...
    selectedNodeId = deleteOrUpdateNode(
      startDiffLength,
      startNodeId,
      caretStart
    );
    // if we deleted the first node in the document, use the node that documentModel.delete() returns
    if (selectedNodeId !== startNodeId) {
      return {
        startNodeId: selectedNodeId,
        caretStart: -1
      };
    }

    // After updating or deleting start/middle/end nodes - are we done (return here)? Or do we need to merge nodes?
    // We're done if the user deleted:
    if (!endNodeId || didDeleteEndNode || startDiffLength === 0) {
      return {
        startNodeId: selectedNodeId,
        caretStart: startDiffLength === 0 ? caretStart - 1 : caretStart
      };
    }
    // if we're here, the end node needs to be merged into the start node
    selectedNodeId = endNodeId;
  }

  /**
   * MERGING NODES AFTER DELETE...
   *
   * TODO: make these into sets of atomic commands that are added to a queue,
   *  then make a 'flush' command to process this queue.
   *
   *  UPDATE: immutablejs has helped make this situation more predictable but,
   *  it still isn't conducive to an undo/redo workflow, so leaving the TODO
   *
   *  UPDATE 2: this is a lot more stable after grouping handlers by Node Types.
   *  Splitting out the "DocumentModel" and the "UpdateManager" concerns will help enable undo/redo history.
   *  This will all be revisited during undo/redo.
   *
   *  UPDATE 3: wow, so much easier using a linked list data structure to represent the document, le sigh 🤦‍♀️
   */
  if (documentModel.isMetaType(selectedNodeId)) {
    /* eslint-disable-next-line no-param-reassign */
    startNodeId = documentModel.getPrevNode(selectedNodeId).get('id');
    // focus end of previous node
    /* eslint-disable-next-line no-param-reassign */
    caretStart = -1;
    documentModel.delete(documentModel.getNode(selectedNodeId));
  } else {
    /* eslint-disable-next-line no-param-reassign */
    ({ startNodeId, caretStart } = handleBackspaceTextType(
      documentModel,
      selectedNodeId
    ));
  }
  return { startNodeId, caretStart };
}
