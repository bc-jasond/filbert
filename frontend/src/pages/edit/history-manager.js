import { fromJS, Map } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_STATE,
  HISTORY_KEY_UNEXECUTE_STATES,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { moreThanNCharsAreDifferent, reviver } from '../../common/utils';

export const characterDiffSize = 6;

export default function HistoryManager(postId, pendingHistoryLog = []) {
  let historyCandidateNode = Map();
  let historyCandidateUnexecuteSelectionOffsets = {};
  let historyCandidateExecuteSelectionOffsets = {};
  let historyCandidateStateEntry = {};
  let historyCandidateTimeout;
  let historyLog = [];
  let hasPendingRequest = false;

  function getLocalHistoryLog() {
    return historyLog;
  }

  function clearPending() {
    // clear cache
    historyCandidateNode = Map();
    historyCandidateUnexecuteSelectionOffsets = {};
    historyCandidateExecuteSelectionOffsets = {};
    historyCandidateStateEntry = {};
    clearTimeout(historyCandidateTimeout);
  }

  function historyStateIsNotEmptyOrNoop(historyState) {
    return (
      // they can't both be falsy
      (historyState.executeState || historyState.unexecuteState) &&
      // they can't both be equal
      // wrap in Map() to use equals()
      // use reviver to expand Selections for deep comparison
      !Map(fromJS(historyState.executeState, reviver)).equals(
        Map(fromJS(historyState.unexecuteState, reviver))
      )
    );
  }

  function flushPendingHistoryLogEntry() {
    if (historyStateIsNotEmptyOrNoop(historyCandidateStateEntry)) {
      const historyEntry = fromJS(
        {
          executeSelectionOffsets: historyCandidateExecuteSelectionOffsets,
          unexecuteSelectionOffsets: historyCandidateUnexecuteSelectionOffsets,
          [HISTORY_KEY_STATE]: [historyCandidateStateEntry],
        },
        reviver
      );
      console.info(
        'HISTORY PENDING: adding to node update history log',
        historyEntry.toJS()
      );
      historyLog.push(historyEntry);
    }
    clearPending();
  }

  function appendToHistoryLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    historyState,
  }) {
    flushPendingHistoryLogEntry();
    if (!historyState) {
      return;
    }

    const historyEntry = fromJS(
      {
        executeSelectionOffsets,
        unexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: historyState.filter(historyStateIsNotEmptyOrNoop),
      },
      reviver
    );
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    historyLog.push(historyEntry);
  }

  /**
   * This function does 2 things:
   * 1) derives a list of nodes that have been updated (or deleted) from the local history log
   * 2) sends both the updated nodes as a map keyed on "nodeId" and the local history log itself
   *
   * Thoughts: if the "appendToHistoryLog" functions are smarter then they can generate a diff to add to the log
   */
  async function saveAndClearLocalHistoryLog() {
    if (hasPendingRequest) {
      return { throttled: true };
    }
    const nodeUpdatesByNodeId = historyLog
      // TODO: de-dupe happens on API, probably could clean that up here before it goes over the wire
      .flatMap((historyEntry) =>
        historyEntry
          .get(HISTORY_KEY_STATE)
          .filter((historyState) => historyState && historyState.size > 0)
          .map((historyState) => {
            const unexecute = historyState.get(HISTORY_KEY_UNEXECUTE_STATES);
            const execute = historyState.get(HISTORY_KEY_EXECUTE_STATES);
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
      contentNodeHistoryLog: historyLog,
    });
    hasPendingRequest = false;

    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return { error };
    }
    // clear the pending history queue after successful save
    historyLog = [];
    console.info('Save Batch result', nodeUpdatesByNodeId, result);
    return result;
  }

  function appendToHistoryLogWhenNCharsAreDifferent({
    unexecuteSelectionOffsets,
    executeSelectionOffsets,
    historyState,
    comparisonPath,
  }) {
    if (historyState.length > 1) {
      throw new Error("I don't handle historyState with length > 1");
    }
    // compare last node in history historyState - there's only one node
    const [lastStateEntry] = historyState;
    const {
      unexecuteState: nodeBeforeUpdate,
      executeState: nodeAfterUpdate,
    } = lastStateEntry;

    // always update the "execute" historyState
    historyCandidateStateEntry.executeState = nodeAfterUpdate;
    historyCandidateExecuteSelectionOffsets = executeSelectionOffsets;
    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(flushPendingHistoryLogEntry, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateNode.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateNode.get('id')) {
        // make history entry for existing changes before tracking new node
        flushPendingHistoryLogEntry();
      }
      historyCandidateNode = nodeBeforeUpdate; // this node matches the historyState in state.unexecuteState AKA "before" documentModel.update()
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
    const { error, data } = await apiPost(apiUrl, {});
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

export function getLastExecuteIdFromHistory(history) {
  return [...history].pop().executeState.get('id');
}
