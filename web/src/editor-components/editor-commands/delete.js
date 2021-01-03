/* eslint-disable import/prefer-default-export */
import { cleanText } from '@filbert/util';
import { isCollapsed } from '../../common/dom';

export function doDeleteSingleNode(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, caretStart, caretEnd } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  const { willDeleteStartNode } = documentModel.willDeleteStartAndEnd(
    selectionOffsets
  );

  // ignore for select-and-type, cut & paste replace actions
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

  // TODO: handle replacing MetaType node
  // NOTE: this is unexpected for select-and-type or paste, better to just "clear" the node of all text
  if (willDeleteStartNode && documentModel.isMetaType(startNodeId)) {
  }
  // delete one or more chars in TextType select-and-type, cut or paste
  const diffLength = caretEnd - caretStart;
  const historyState = [];
  historyState.push(
    ...documentModel.deleteNodeContentRangeAndUpdateSelections(
      diffLength,
      startNodeId,
      caretStart
    )
  );
  return { historyState, selectionOffsets: executeSelectionOffsets };
}

export function doDeleteSingleNodeBackspace(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, caretStart, caretEnd } = selectionOffsets;
  const caretIsCollapsed = isCollapsed(selectionOffsets);
  const { willDeleteStartNode } = documentModel.willDeleteStartAndEnd(
    selectionOffsets
  );
  const startNode = documentModel.getNode(startNodeId);
  const startPrevNode = documentModel.getPrevNode(startNodeId);
  const startNodeWasFirstNode = startPrevNode.isEmpty();
  let executeSelectionOffsets;

  console.debug('Delete - SINGLE NODE');

  // decide where to place the caret before altering the document state
  if (caretIsCollapsed && caretStart === 0 && !startNodeWasFirstNode) {
    // delete or merge previous node, if not first node
    const caretStartPrev = documentModel.isMetaType(startPrevNode.get('id'))
      ? 0
      : cleanText(startPrevNode.get('content')).length;
    // focus prev MetaType or prev TextType content length (before merge)
    executeSelectionOffsets = {
      startNodeId: startPrevNode.get('id'),
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
    const historyState = documentModel.deleteNode(startNode);
    historyManager.appendToHistoryLog({
      historyState,
      selectionOffsets: executeSelectionOffsets,
    });
    return { historyState, selectionOffsets: executeSelectionOffsets };
  }
  // caret collapsed - at beginning of TextType node (merge with prev TextType or delete prev MetaType node)
  if (caretIsCollapsed && caretStart === 0) {
    const historyState = [];
    if (startNodeWasFirstNode) {
      // first node in the document - ignore
      return { historyState, selectionOffsets: executeSelectionOffsets };
    }
    if (documentModel.isMetaType(startPrevNode.get('id'))) {
      // delete the previous MetaType node
      historyState.push(...documentModel.deleteNode(startPrevNode));
    } else {
      // merge with the previous TextType node
      historyState.push(
        ...documentModel.mergeParagraphs(startPrevNode.get('id'), startNodeId)
      );
    }
    historyManager.appendToHistoryLog({
      historyState,
      selectionOffsets: executeSelectionOffsets,
    });
    return { historyState, selectionOffsets: executeSelectionOffsets };
  }
  // delete one or more chars in TextType (collapsed caret backspace or highlight-and-backspace in one node)
  // NOTE: for collapsed caret - pass a diffLength of 0, other functions will understand it as "delete one char to the left of the caret"
  const diffLength = caretEnd - caretStart;
  const historyState = [];
  historyState.push(
    ...documentModel.deleteNodeContentRangeAndUpdateSelections(
      diffLength,
      startNodeId,
      caretStart
    )
  );
  historyManager.appendToHistoryLogWhenNCharsAreDifferent({
    historyState,
    selectionOffsets: executeSelectionOffsets,
    comparisonPath: ['content'],
  });
  return { historyState, selectionOffsets: executeSelectionOffsets };
}

export function doDeleteMultiNode(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;
  const {
    willDeleteStartNode,
    willDeleteEndNode,
  } = documentModel.willDeleteStartAndEnd(selectionOffsets);
  const startNode = documentModel.getNode(startNodeId);
  const historyState = [];

  console.debug('Delete - MULTI NODE');

  // for non-merge delete operations, always focus the beginning of the selection
  const executeSelectionOffsets = { startNodeId, caretStart };

  // delete any middle nodes
  documentModel.getNodesBetween(startNodeId, endNodeId).forEach((node) => {
    console.info('delete middle node', node.toJS());
    historyState.push(...documentModel.deleteNode(node));
  });

  // delete startNode
  historyState.push(
    ...documentModel.deleteNodeContentRangeAndUpdateSelections(
      startNode.get('content').length - caretStart,
      startNodeId,
      caretStart
    )
  );

  // delete endNode
  const endNode = documentModel.getNode(endNodeId);
  if (willDeleteEndNode) {
    historyState.push(...documentModel.deleteNode(endNode));
  } else if (caretEnd > 0) {
    // TODO: since functions called later on expect a diffLength === 0 to mean "delete one char in front of the caret"
    //  we need to make sure not to call this for select-and-type or paste operations...
    historyState.push(
      ...documentModel.deleteNodeContentRangeAndUpdateSelections(
        caretEnd,
        endNodeId,
        0
      )
    );
  }

  // merge? the only merge scenario is when both are text and both weren't deleted
  const startNodeAndEndNodeAreTextType =
    documentModel.isTextType(startNodeId) &&
    documentModel.isTextType(endNodeId);
  if (
    !(willDeleteStartNode && willDeleteEndNode) &&
    startNodeAndEndNodeAreTextType
  ) {
    historyState.push(...documentModel.mergeParagraphs(startNodeId, endNodeId));
  }

  return { historyState, selectionOffsets: executeSelectionOffsets };
}

export function doDeleteMultiNodeBackspace(
  documentModel,
  historyManager,
  selectionOffsets
) {
  const { startNodeId, endNodeId, caretStart, caretEnd } = selectionOffsets;
  const {
    willDeleteStartNode,
    willDeleteEndNode,
  } = documentModel.willDeleteStartAndEnd(selectionOffsets);
  const startNode = documentModel.getNode(startNodeId);
  const startPrevNode = documentModel.getPrevNode(startNodeId);
  const startNodeWasFirstNode = startPrevNode.isEmpty();
  let executeSelectionOffsets;
  const historyState = [];

  console.debug('Delete - MULTI NODE');

  // decide where to place the caret before altering the document state
  const endNextNode = documentModel.getNextNode(endNodeId);
  const endNodeWasLastNode = endNextNode.isEmpty();
  if (willDeleteStartNode) {
    if (willDeleteEndNode) {
      if (startNodeWasFirstNode) {
        if (endNodeWasLastNode) {
          // deleted all nodes in the document - startNode will have been transformed into a placeholder title - focus startNode at position 0
          executeSelectionOffsets = { startNodeId, caretStart: 0 };
        } else {
          // deleted through the top of the document - focus node after endNode
          executeSelectionOffsets = {
            startNodeId: endNextNode.get('id'),
            caretStart: 0,
          };
        }
      } else {
        // deleted start and end
        executeSelectionOffsets = {
          startNodeId: startPrevNode.get('id'),
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

  // delete any middle nodes
  documentModel.getNodesBetween(startNodeId, endNodeId).forEach((node) => {
    console.info('delete middle node', node.toJS());
    historyState.push(...documentModel.deleteNode(node));
  });

  // delete startNode
  if (willDeleteStartNode) {
    historyState.push(...documentModel.deleteNode(startNode));
  } else {
    historyState.push(
      ...documentModel.deleteNodeContentRangeAndUpdateSelections(
        startNode.get('content').length - caretStart,
        startNodeId,
        caretStart
      )
    );
  }

  // delete endNode
  const endNode = documentModel.getNode(endNodeId);
  if (willDeleteEndNode) {
    historyState.push(...documentModel.deleteNode(endNode));
  } else {
    historyState.push(
      ...documentModel.deleteNodeContentRangeAndUpdateSelections(
        caretEnd,
        endNodeId,
        0
      )
    );
  }

  // merge? the only merge scenario is when both are text and both weren't deleted
  const startNodeAndEndNodeAreTextType =
    documentModel.isTextType(startNodeId) &&
    documentModel.isTextType(endNodeId);
  if (
    !(willDeleteStartNode && willDeleteEndNode) &&
    startNodeAndEndNodeAreTextType
  ) {
    historyState.push(...documentModel.mergeParagraphs(startNodeId, endNodeId));
  }

  historyManager.appendToHistoryLog({
    selectionOffsets: executeSelectionOffsets,
    historyState,
  });

  return { historyState, selectionOffsets: executeSelectionOffsets };
}
