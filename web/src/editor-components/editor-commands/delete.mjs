import { deleteContentRange } from '@filbert/util';
import { isCollapsed } from '../../common/dom.mjs';
import { getNode, getId, getPrev, getNext, isHead } from '@filbert/linked-list';
import {
  update,
  deleteNode,
  isMetaType,
  isTextType,
  contentClean,
  NODE_CONTENT,
  getNodesBetween,
} from '@filbert/document';

// given selectionOffsets - return 2 boolean values for {willDeleteStartNode, willDeleteEndNode}
function willDeleteStartAndEnd(
  documentModel,
  { startNodeId, caretStart, endNodeId, caretEnd }
) {
  const startNode = getNode(documentModel, startNodeId);
  const endNode = getNode(documentModel, endNodeId);
  const willDeleteStartNode =
    isMetaType(startNode) || (endNodeId && caretStart === 0);
  // NOTE: don't delete node if user selects all text inside of one node only
  //|| (caretStart === 0 &&
  //   caretEnd === this.getNode(startNodeId).get('content', '').length);
  const willDeleteEndNode =
    endNode &&
    (isMetaType(endNode) || caretEnd === contentClean(endNode).length);
  return { willDeleteStartNode, willDeleteEndNode };
}

// returns a nodeId for node deleted, false for node updated
function deleteNodeContentRangeAndUpdateSelections(
  documentModel,
  diffLength,
  nodeId,
  startIdx
) {
  let node = getNode(documentModel, nodeId);
  /* TODO: delete node under if all content has been highlighted
  if (startIdx === 0 && diffLength >= content.length) {
    return documentModel.deleteNode(node);
  } */
  // only some of endNode's content has been selected, delete that content
  const beforeContent = contentClean(node);
  node = node.set(
    NODE_CONTENT,
    deleteContentRange(beforeContent, startIdx, diffLength)
  );
  /* TODO with FormatSelections
  node.formatSelections.adjustSelectionOffsetsAndCleanup(
    node.content.length,
    beforeContent.length,
    startIdx + diffLength,
    // -1 for "regular" backspace to delete 1 char
    diffLength === 0 ? -1 : -diffLength
  );*/
  let historyLogEntry;
  ({ documentModel, historyLogEntry } = update(documentModel, node));
  return { documentModel, historyLogEntry };
}

function mergeParagraphs(documentModel, left, right) {
  if (!(isTextType(left) && isTextType(right))) {
    console.error('mergeParagraphs - can`t do it!', left, right);
    throw new Error('mergeParagraphs - invalid paragraphs');
  }
  const historyLogEntries = [];

  /* TODO: FormatSelections  // do selections before concatenating content!
  if (left.canHaveSelections()) {
    left.formatSelections.concatSelections(right);
  }*/
  left = left.set(NODE_CONTENT, `${left.content}${right.content}`);
  let historyLogEntry;
  ({ documentModel, historyLogEntry } = update(documentModel, left));
  historyLogEntries.push(historyLogEntry);
  ({ documentModel, historyLogEntry } = deleteNode(documentModel, right));
  historyLogEntries.push(historyLogEntry);
  return { documentModel, historyLogEntries };
}

export function doDeleteSingleNode(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, caretStart, caretEnd } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  const { willDeleteStartNode } = willDeleteStartAndEnd(
    documentModel,
    selectionOffsets
  );

  if (caretIsCollapsed) {
    return;
  }

  console.debug('Delete - SINGLE NODE - no merge');

  // decide where to place the caret before altering the document state
  // deleting from single node - if there's a selection is just caretStart, otherwise subtract 1 - don't go beyond 0
  const executeSelectionOffsets = {
    startNodeId,
    caretStart,
  };
  const startNode = getNode(documentModel, startNodeId);
  // TODO: handle replacing MetaType node
  // NOTE: this is unexpected for select-and-type or paste, better to just "clear" the node of all text
  if (willDeleteStartNode && isMetaType(startNode)) {
    return;
  }
  // delete one or more chars in TextType select-and-type, cut or paste
  const diffLength = caretEnd - caretStart;
  let historyLogEntry;
  ({
    documentModel,
    historyLogEntry,
  } = deleteNodeContentRangeAndUpdateSelections(
    documentModel,
    diffLength,
    startNodeId,
    caretStart
  ));
  return {
    documentModel,
    historyLogEntries: [historyLogEntry],
    selectionOffsets: executeSelectionOffsets,
  };
}

/**
 * performs a merge after delete
 */
export function doDeleteSingleNodeBackspace(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, caretStart, caretEnd } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  const { willDeleteStartNode } = willDeleteStartAndEnd(
    documentModel,
    selectionOffsets
  );
  const startNode = getNode(documentModel, startNodeId);
  const startPrevNode = getPrev(documentModel, startNodeId);
  const startNodeWasFirstNode = isHead(documentModel, startNode);
  let executeSelectionOffsets;

  console.debug('Delete - SINGLE NODE');

  // decide where to place the caret before altering the document state
  if (caretIsCollapsed && caretStart === 0 && !startNodeWasFirstNode) {
    // delete or merge previous node, if not first node
    const caretStartPrev = isMetaType(startPrevNode)
      ? 0
      : contentClean(startPrevNode).length;
    // focus prev MetaType or prev TextType content length (before merge)
    executeSelectionOffsets = {
      startNodeId: getId(startPrevNode),
      caretStart: caretStartPrev,
    };
  } else {
    // deleting from single node - if there's a selection is just caretStart, otherwise subtract 1 - don't go beyond 0
    const caretStartAfterDelete = caretIsCollapsed
      ? Math.max(caretStart - 1, 0)
      : caretStart;
    executeSelectionOffsets = {
      startNodeId,
      caretStart: caretStartAfterDelete,
    };
  }

  // delete MetaType node or all of a TextType node
  // NOTE: this is unexpected for select-and-type or paste, better to just "clear" the node of all text
  if (willDeleteStartNode) {
    let historyLogEntry;
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, startNode));
    historyManager.appendToHistoryLog({
      historyLogEntries: [historyLogEntry],
      selectionOffsets: executeSelectionOffsets,
    });
    return { documentModel, selectionOffsets: executeSelectionOffsets };
  }
  // caret collapsed - at beginning of TextType node (merge with prev TextType or delete prev MetaType node)
  if (caretIsCollapsed && caretStart === 0) {
    if (startNodeWasFirstNode) {
      // first node in the document - ignore
      return { documentModel, selectionOffsets: executeSelectionOffsets };
    }
    const historyLogEntries = [];
    if (isMetaType(startPrevNode)) {
      // delete the previous MetaType node
      let historyLogEntry;
      ({ documentModel, historyLogEntry } = deleteNode(
        documentModel,
        startPrevNode
      ));
      historyLogEntries.push(historyLogEntry);
    } else {
      // merge with the previous TextType node
      let historyLogEntriesMergeParagraph;
      ({
        documentModel,
        historyLogEntries: historyLogEntriesMergeParagraph,
      } = mergeParagraphs(documentModel, startPrevNode, startNode));
      historyLogEntries.push(...historyLogEntriesMergeParagraph);
    }
    historyManager.appendToHistoryLog({
      historyLogEntries,
      selectionOffsets: executeSelectionOffsets,
    });
    return { documentModel, selectionOffsets: executeSelectionOffsets };
  }
  // delete one or more chars in TextType (collapsed caret backspace or highlight-and-backspace in one node)
  // NOTE: for collapsed caret - pass a diffLength of 0, other functions will understand it as "delete one char to the left of the caret"
  const diffLength = caretEnd - caretStart;
  let historyLogEntry;
  ({
    documentModel,
    historyLogEntry,
  } = deleteNodeContentRangeAndUpdateSelections(
    documentModel,
    diffLength,
    startNodeId,
    caretStart
  ));
  historyManager.appendToHistoryLogWhenNCharsAreDifferent({
    historyLogEntries: [historyLogEntry],
    selectionOffsets: executeSelectionOffsets,
    comparisonKey: NODE_CONTENT,
  });
  return { documentModel, selectionOffsets: executeSelectionOffsets };
}

export function doDeleteMultiNode(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;
  const { willDeleteStartNode, willDeleteEndNode } = willDeleteStartAndEnd(
    documentModel,
    selectionOffsets
  );
  const startNode = getNode(documentModel, startNodeId);
  const historyLogEntries = [];

  console.debug('Delete - MULTI NODE');

  // for non-merge delete operations, always focus the beginning of the selection
  const executeSelectionOffsets = { startNodeId, caretStart };
  let historyLogEntry;
  // delete any middle nodes
  getNodesBetween(documentModel, startNodeId, endNodeId).forEach((node) => {
    console.info('delete middle node', node.toJS());
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, node));
    historyLogEntries.push(historyLogEntry);
  });

  // delete startNode
  ({
    documentModel,
    historyLogEntry,
  } = deleteNodeContentRangeAndUpdateSelections(
    documentModel,
    contentClean(startNode).length - caretStart,
    startNodeId,
    caretStart
  ));
  historyLogEntries.push(historyLogEntry);

  // delete endNode
  const endNode = getNode(documentModel, endNodeId);
  if (willDeleteEndNode) {
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, endNode));
    historyLogEntries.push(historyLogEntry);
  } else if (caretEnd > 0) {
    // TODO: since functions called later on expect a diffLength === 0 to mean "delete one char in front of the caret"
    //  we need to make sure not to call this for select-and-type or paste operations
    ({
      documentModel,
      historyLogEntry,
    } = deleteNodeContentRangeAndUpdateSelections(
      documentModel,
      caretEnd,
      endNodeId,
      0
    ));
    historyLogEntries.push(historyLogEntry);
  }

  // merge? the only merge scenario is when both are text and both weren't deleted
  if (
    !(willDeleteStartNode && willDeleteEndNode) &&
    isTextType(startNode) &&
    isTextType(endNode)
  ) {
    let historyLogEntriesMergeParagraph;
    ({
      documentModel,
      historyLogEntries: historyLogEntriesMergeParagraph,
    } = mergeParagraphs(documentModel, startNode, endNode));
    historyLogEntries.push(...historyLogEntriesMergeParagraph);
  }

  return {
    documentModel,
    historyLogEntries,
    selectionOffsets: executeSelectionOffsets,
  };
}

/**
 * performs a merge after delete
 */
export function doDeleteMultiNodeBackspace(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;
  const { willDeleteStartNode, willDeleteEndNode } = willDeleteStartAndEnd(
    documentModel,
    selectionOffsets
  );
  const startNode = getNode(documentModel, startNodeId);
  const startPrevNode = getPrev(documentModel, startNodeId);
  const startNodeWasFirstNode = isHead(documentModel, startNode);
  let executeSelectionOffsets;
  const historyLogEntries = [];

  console.debug('Delete - MULTI NODE');

  // decide where to place the caret before altering the document state
  const endNextNode = getNext(documentModel, endNodeId);
  if (willDeleteStartNode) {
    if (willDeleteEndNode) {
      if (startNodeWasFirstNode) {
        if (!endNextNode) {
          // deleted all nodes in the document - startNode will have been transformed into a placeholder title - focus startNode at position 0
          executeSelectionOffsets = { startNodeId, caretStart: 0 };
        } else {
          // deleted through the top of the document - focus node after endNode
          executeSelectionOffsets = {
            startNodeId: endNextNode.id,
            caretStart: 0,
          };
        }
      } else {
        // deleted start and end
        executeSelectionOffsets = {
          startNodeId: startPrevNode.id,
          caretStart: -1,
        };
      }
    } else {
      // deleted start node and part of end node - focus end node at beginning
      executeSelectionOffsets = { startNodeId: endNodeId, caretStart: 0 };
    }
  } else {
    // didn't delete all of startNode - focus caretStart since we're deleting up to it
    executeSelectionOffsets = { startNodeId, caretStart };
  }
  let historyLogEntry;
  // delete any middle nodes
  getNodesBetween(documentModel, startNodeId, endNodeId).forEach((node) => {
    console.info('delete middle node', node.toJS());
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, node));
    historyLogEntries.push(historyLogEntry);
  });

  // delete startNode
  if (willDeleteStartNode) {
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, startNode));
    historyLogEntries.push(historyLogEntry);
  } else {
    ({
      documentModel,
      historyLogEntry,
    } = deleteNodeContentRangeAndUpdateSelections(
      documentModel,
      contentClean(startNode).length - caretStart,
      startNodeId,
      caretStart
    ));
    historyLogEntries.push(historyLogEntry);
  }

  // delete endNode
  const endNode = getNode(documentModel, endNodeId);
  if (willDeleteEndNode) {
    ({ documentModel, historyLogEntry } = deleteNode(documentModel, endNode));
    historyLogEntries.push(historyLogEntry);
  } else {
    ({
      documentModel,
      historyLogEntry,
    } = deleteNodeContentRangeAndUpdateSelections(
      documentModel,
      caretEnd,
      endNodeId,
      0
    ));
    historyLogEntries.push(historyLogEntry);
  }

  // merge? the only merge scenario is when both are text and both weren't deleted
  if (
    !(willDeleteStartNode && willDeleteEndNode) &&
    isTextType(startNode) &&
    isTextType(endNode)
  ) {
    let historyLogEntriesMergeParagraphs;
    ({
      documentModel,
      historyLogEntries: historyLogEntriesMergeParagraphs,
    } = mergeParagraphs(documentModel, startNode, endNode));
    historyLogEntries.push(...historyLogEntriesMergeParagraphs);
  }

  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyLogEntries,
  });

  return { documentModel, selectionOffsets: executeSelectionOffsets };
}

export function deleteSelection({
  documentModel,
  historyManager,
  selectionOffsets,
}) {
  const historyLogEntries = [];
  // select-and-hit-enter ?? delete selection first
  const { endNodeId } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  if (!caretIsCollapsed) {
    let historyLogEntriesDelete;
    if (endNodeId) {
      ({
        documentModel,
        historyLogEntries: historyLogEntriesDelete,
      } = doDeleteMultiNode(documentModel, historyManager, selectionOffsets));
    } else {
      ({
        documentModel,
        historyLogEntries: historyLogEntriesDelete,
      } = doDeleteSingleNode(documentModel, historyManager, selectionOffsets));
    }
    historyLogEntries.push(...historyLogEntriesDelete);
  }
  return { documentModel, historyLogEntries };
}
