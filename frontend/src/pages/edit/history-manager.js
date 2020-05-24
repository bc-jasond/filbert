import { fromJS, is, Map } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_STATE,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { moreThanNCharsAreDifferent, reviver } from '../../common/utils';

export const characterDiffSize = 6;

let historyCandidateNode = Map();
let historyCandidateUnexecuteSelectionOffsets = {};
let historyCandidateExecuteSelectionOffsets = {};
let historyCandidateStateEntry = {};
let historyCandidateTimeout;
let historyQueue = [];
let hasPendingRequest = false;

export default function HistoryManager(postId, pendingHistoryQueue = []) {
  function getHistoryQueue() {
    return historyQueue;
  }

  function clearPending() {
    // clear cache
    historyCandidateNode = Map();
    historyCandidateUnexecuteSelectionOffsets = {};
    historyCandidateExecuteSelectionOffsets = {};
    historyCandidateStateEntry = {};
    clearTimeout(historyCandidateTimeout);
  }

  async function flushPendingNodeUpdateLogEntry() {
    if (!historyCandidateStateEntry) {
      return;
    }
    const historyEntry = fromJS(
      {
        [HISTORY_KEY_EXECUTE_OFFSETS]: historyCandidateExecuteSelectionOffsets,
        [HISTORY_KEY_UNEXECUTE_OFFSETS]: historyCandidateUnexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: [historyCandidateStateEntry],
      },
      reviver
    );
    console.info(
      'HISTORY PENDING: adding to node update history log',
      historyEntry.toJS()
    );
    historyQueue.push(historyEntry);
    clearPending();
  }

  async function appendToNodeUpdateLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    state,
  }) {
    clearPending();
    if (!state) {
      return;
    }
    const historyEntry = fromJS(
      {
        [HISTORY_KEY_EXECUTE_OFFSETS]: executeSelectionOffsets,
        [HISTORY_KEY_UNEXECUTE_OFFSETS]: unexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: state.filter(
          // remove no-op state entries
          (entry) =>
            // use reviver to expand Selections
            !fromJS(entry.executeState, reviver).equals(
              fromJS(entry.unexecuteState, reviver)
            )
        ),
      },
      reviver
    );
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    historyQueue.push(historyEntry);
  }

  // saves current snapshot of document given new history
  async function saveContentBatch() {
    if (hasPendingRequest) {
      return {};
    }
    const nodeUpdatesByNodeId = historyQueue
      // TODO: de-dupe happens on API, probably could clean that up here before it goes over the wire
      .flatMap((historyEntry) =>
        historyEntry
          .get(HISTORY_KEY_STATE)
          .map((state) => {
            const unexecute = state.get(HISTORY_KEY_UNEXECUTE_STATES);
            const execute = state.get(HISTORY_KEY_EXECUTE_STATES);
            // if execute is falsy, it was a delete operation.  Use the unexecute id to delete
            return execute || unexecute.get('id');
          })
          .toJS()
      );

    if (nodeUpdatesByNodeId.length === 0) {
      // we're current, no new updates to save
      return {};
    }

    hasPendingRequest = true;
    const { error, data: result } = await apiPost(`/content/${postId}`, {
      nodeUpdatesByNodeId,
      // save history entries for new history only
      contentNodeHistory: historyQueue,
    });
    hasPendingRequest = false;

    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return {};
    }
    // clear the pending history queue after successful save
    historyQueue = [];
    console.info('Save Batch result', nodeUpdatesByNodeId, result);
    return result;
  }

  function appendToNodeUpdateLogWhenNCharsAreDifferent({
    unexecuteSelectionOffsets,
    executeSelectionOffsets,
    state,
    comparisonPath,
  }) {
    if (state.length > 1) {
      throw new Error("I don't handle state with length > 1");
    }
    // compare last node in history state
    const lastStateEntry = [...state].pop();
    const {
      unexecuteState: nodeBeforeUpdate,
      executeState: nodeAfterUpdate,
    } = lastStateEntry;

    // always update the "execute" state
    historyCandidateStateEntry.executeState = nodeAfterUpdate;
    historyCandidateExecuteSelectionOffsets = executeSelectionOffsets;
    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(flushPendingNodeUpdateLogEntry, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateNode.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateNode.get('id')) {
        // make history entry for existing changes before tracking new node
        flushPendingNodeUpdateLogEntry();
      }
      historyCandidateNode = nodeBeforeUpdate; // this node matches the state in state.unexecuteState AKA "before" documentModel.update()
      historyCandidateUnexecuteSelectionOffsets = unexecuteSelectionOffsets;
      historyCandidateStateEntry = lastStateEntry;
    }

    // TODO: get document state (selectedNodeMap) and add to history list here
    if (
      moreThanNCharsAreDifferent(
        nodeAfterUpdate.getIn(comparisonPath, ''),
        historyCandidateNode.getIn(comparisonPath, '')
      )
    ) {
      flushPendingNodeUpdateLogEntry();
    }
  }

  function applyNodeUpdates(stateUpdatesByNodeId, nodesById) {
    let updatedNodesById = nodesById;

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

  async function undo(currentNodesById) {
    if (hasPendingRequest) {
      return Map();
    }
    hasPendingRequest = true;
    const { error: undoError, data } = await apiPost(`/undo/${postId}`, {});
    hasPendingRequest = false;
    if (undoError) {
      console.error(undoError);
      return Map();
    }
    const undoResult = fromJS(data, reviver);
    // at beginning (empty object)?
    if (is(undoResult, Map())) {
      return Map();
    }
    const updatedPost = undoResult.get('updatedPost');
    const unexecuteOffsets = undoResult.get('selectionOffsets');
    const unexecuteStatesByNodeId = undoResult.get('nodeUpdatesById', Map());

    if (unexecuteStatesByNodeId.size === 0) {
      return Map();
    }

    // apply updates to current document state
    const nodesById = applyNodeUpdates(
      unexecuteStatesByNodeId,
      currentNodesById
    );
    return Map({ nodesById, selectionOffsets: unexecuteOffsets, updatedPost });
  }

  async function redo(currentNodesById) {
    if (hasPendingRequest) {
      return Map();
    }
    hasPendingRequest = true;
    const { error: redoError, data } = await apiPost(`/redo/${postId}`, {});
    hasPendingRequest = false;
    if (redoError) {
      console.error(redoError);
      return Map();
    }
    const redoResult = fromJS(data, reviver);
    // at beginning (empty object)?
    if (is(redoResult, Map())) {
      return Map();
    }
    const updatedPost = redoResult.get('updatedPost');
    const executeOffsets = redoResult.get('selectionOffsets');
    const executeStatesByNodeId = redoResult.get('nodeUpdatesById');

    if (executeStatesByNodeId.size === 0) {
      return Map();
    }

    // apply updates to current document state
    const nodesById = applyNodeUpdates(executeStatesByNodeId, currentNodesById);
    return Map({ nodesById, selectionOffsets: executeOffsets, updatedPost });
  }

  // a new placeholder post will have not-yet-saved pending history
  historyQueue = pendingHistoryQueue;

  return {
    getHistoryQueue,
    saveContentBatch,
    flushPendingNodeUpdateLogEntry,
    appendToNodeUpdateLog,
    appendToNodeUpdateLogWhenNCharsAreDifferent,
    undo,
    redo,
  };
}

export function getLastExecuteIdFromHistory(history) {
  return [...history].pop().executeState.get('id');
}
