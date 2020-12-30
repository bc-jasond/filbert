import { fromJS, Map } from 'immutable';
import { moreThanNCharsAreDifferent } from '@filbert/util';
import { reviver } from '@filbert/selection';

export function historyStateIsValid(historyState, nodesById) {
  function walk(node) {
    // delete operation? - verify node is in document
    if (typeof node === 'string') {
      return nodesById.get(node).size > 0;
    }
    if (!Map.isMap(node)) {
      //console.warn("validate history: node not a map", node)
      return false;
    }
    if (!node.get('next_sibling_id')) {
      return true;
    }
    const nextId = node.get('next_sibling_id');
    let nextNode = historyState.get(nextId) ?? nodesById.get(nextId);
    return !nextNode ? false : walk(nextNode);
  }
  let valid = true;
  historyState.forEach((node, nodeId) => {
    if (node === nodeId && !nodesById.get(nodeId)) {
      // a delete operation on a nodeId not in the document
      valid = false;
    } else {
      if (!walk(node)) {
        valid = false;
      }
    }
  });
  return valid;
}

export function HistoryManager(postId, apiClient, pendingHistoryLog = []) {
  let historyCandidateLastSavedState = Map();
  let historyCandidateState = Map();
  let historyCandidateSelectionOffsets = {};
  let historyCandidateTimeout;
  let historyLog = [];
  let hasPendingRequest = false;

  function getLocalHistoryLog() {
    return historyLog;
  }

  function clearPending() {
    // clear cache
    historyCandidateState = Map();
    historyCandidateSelectionOffsets = {};
    clearTimeout(historyCandidateTimeout);
  }

  /**
   * history comes in as an array of execute states in order.  This function flattens the array into a map using last-wins
   * map of id => node
   *
   * @param Array historyState
   * @returns {Map<any, any>}
   */
  function flattenHistory(historyState) {
    let nodesById = Map();
    // the document model is in charge of making sure that history entries arrive in the correct order so we can just use last-wins
    // to create an atomic update map keyed on nodeId
    historyState.forEach((stateOrId) => {
      if (!stateOrId) {
        throw new Error(
          `history - invalid state\n${historyState.toJS()}\n${nodesById.toJS()}`
        );
      }
      const nodeId =
        typeof stateOrId === 'string' ? stateOrId : stateOrId.get('id');
      nodesById = nodesById.set(nodeId, stateOrId);
    });
    return nodesById;
  }

  function flushPendingHistoryLogEntry() {
    if (historyCandidateState.size === 0) {
      return;
    }
    const historyEntry = fromJS(
      {
        selectionOffsets: historyCandidateSelectionOffsets,
        historyState: flattenHistory([historyCandidateState]),
      },
      reviver
    );
    console.info(
      'HISTORY PENDING: adding to node update history log',
      historyEntry.toJS()
    );
    historyLog.push(historyEntry);
    clearPending();
  }

  function appendToHistoryLog({ selectionOffsets, historyState }) {
    flushPendingHistoryLogEntry();
    if (!historyState) {
      return;
    }

    const historyEntry = fromJS(
      {
        selectionOffsets,
        historyState: flattenHistory(historyState),
      },
      reviver
    );
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    historyLog.push(historyEntry);
  }

  async function saveAndClearLocalHistoryLog() {
    if (hasPendingRequest) {
      return { throttled: true };
    }
    if (historyLog.length === 0) {
      // we're current, no new updates to save
      return {};
    }

    hasPendingRequest = true;
    const { error, data: result } = await apiClient.post(`/content/${postId}`, {
      contentNodeHistoryLog: historyLog,
    });
    hasPendingRequest = false;

    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return { error };
    }
    // clear the pending history queue after successful save
    console.info('Save History Batch result', historyLog, result);
    historyLog = [];
    return result;
  }

  function appendToHistoryLogWhenNCharsAreDifferent({
    selectionOffsets,
    historyState,
    comparisonPath,
  }) {
    if (historyState.length > 1) {
      throw new Error("I don't handle historyState with length > 1");
    }
    // compare last node in history historyState - there's only one node
    const [nodeAfterUpdate] = historyState;

    // always update the caret position
    historyCandidateSelectionOffsets = selectionOffsets;

    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(flushPendingHistoryLogEntry, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateState.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateState.get('id')) {
        // make history entry for existing changes before tracking new node
        flushPendingHistoryLogEntry();
      }
      historyCandidateState = nodeAfterUpdate;
      historyCandidateLastSavedState = nodeAfterUpdate;
      return;
    }

    historyCandidateState = nodeAfterUpdate;
    if (
      moreThanNCharsAreDifferent(
        historyCandidateState.getIn(comparisonPath, ''),
        historyCandidateLastSavedState.getIn(comparisonPath, '')
      )
    ) {
      flushPendingHistoryLogEntry();
    }
  }

  function applyNodeUpdates(stateUpdatesByNodeId, nodesById) {
    let updatedNodesById = nodesById;
    // this loop de-dupes (last wins) and therefore assumes correct historical order of `stateUpdatesByNodeId`
    // don't forget to reverse it for undo
    stateUpdatesByNodeId.forEach((update) => {
      // an "update" will contain a whole node as Map()
      // a "delete" will contain just a node id as string
      const currentIsDelete = typeof update === 'string';
      const updateId = currentIsDelete ? update : update.get('id');
      if (currentIsDelete) {
        updatedNodesById = updatedNodesById.delete(updateId);
        return;
      }
      updatedNodesById = updatedNodesById.set(updateId, update);
    });

    return updatedNodesById;
  }

  async function undoRedoInternal(currentNodesById, isUndo = true) {

    const apiUrl = `/${isUndo ? 'undo' : 'redo'}/${postId}`;
    if (hasPendingRequest) {
      return Map({ throttled: true });
    }
    hasPendingRequest = true;
    const { error, data } = await apiClient.post(apiUrl, {});
    hasPendingRequest = false;
    if (error) {
      console.error(error);
      return Map({ error });
    }
    const result = fromJS(data, reviver);
    const updatedPost = result.get('updatedPost');
    const selectionOffsets = result.get('selectionOffsets');
    const statesByNodeId = result.get('nodeUpdatesById', Map());

    if (statesByNodeId.size === 0) {
      return Map();
    }

    // apply updates to current document state
    const nodesById = applyNodeUpdates(statesByNodeId, currentNodesById);
    return Map({
      nodesById,
      selectionOffsets,
      updatedPost,
    });
  }

  async function undo(currentNodesById) {
    return undoRedoInternal(currentNodesById);
  }

  async function redo(currentNodesById) {
    return undoRedoInternal(currentNodesById, false);
  }

  // a new placeholder post will have not-yet-saved pending history
  historyLog = pendingHistoryLog;

  return {
    getLocalHistoryLog,
    saveAndClearLocalHistoryLog,
    flushPendingHistoryLogEntry,
    appendToHistoryLog,
    appendToHistoryLogWhenNCharsAreDifferent,
    undo,
    redo,
  };
}
