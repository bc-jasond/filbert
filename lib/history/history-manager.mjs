import { fromJS, Map } from 'immutable';
import { moreThanNCharsAreDifferent, reviver } from '@filbert/util';

// HISTORY - undo / redo
export const NODE_UPDATE_HISTORY = 'nodeUpdateHistory';
export const HISTORY_KEY_STATE = 'historyState';
export const HISTORY_KEY_UNEXECUTE_OFFSETS = 'unexecuteSelectionOffsets';
export const HISTORY_KEY_UNEXECUTE_STATES = 'unexecuteState';
export const HISTORY_KEY_EXECUTE_STATES = 'executeState';
export const HISTORY_KEY_EXECUTE_OFFSETS = 'executeSelectionOffsets';
export const HISTORY_MIN_NUM_CHARS = 6;

export function HistoryManager(postId, apiClient, pendingHistoryLog = []) {
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

  /**
   * new history shape will be:
   *
   * historyEntry = {
   *     execute: {
   *         selectionOffsets: {},
   *         // these will be flattened with last-wins by nodeId
   *         historyState: {},
   *     },
   *     unexecute: {
   *         selectionOffsets: {},
   *         // these will be flattened with first-wins (reversed for undo) by nodeId
   *         historyState: {},
   *     }
   * }
   *
   */
  function prepareHistoryEntry({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    historyState,
  }) {
    /**
     * history comes in as an array of (un)/execute node pairs in asc order.  This function flattens the to a last-wins (or first-wins for unexecute)
     * map of id => node
     *
     * @param historyState
     * @param shouldExecute
     * @returns {Map<any, any>}
     */
    function flattenHistory(historyState, shouldExecute = true) {
      let nodesById = Map();
      const history = shouldExecute ? historyState : historyState.reverse();
      const primaryKey = shouldExecute ? 'executeState' : 'unexecuteState';
      const otherKey = shouldExecute ? 'unexecuteState' : 'executeState';
      history.forEach((state) => {
        // state will be undefined for insert or delete operations
        // copy the id for easy update of document state
        if (!state[primaryKey]) {
          nodesById = nodesById.set(
            state[otherKey].get('id'),
            state[otherKey].get('id')
          );
        } else {
          nodesById = nodesById.set(
            state[primaryKey].get('id'),
            state[primaryKey]
          );
        }
      });
      return nodesById;
    }

    const retVal = fromJS(
      {
        execute: {
          selectionOffsets: executeSelectionOffsets,
          historyState: flattenHistory(historyState),
        },
        unexecute: {
          selectionOffsets: unexecuteSelectionOffsets,
          historyState: flattenHistory(historyState, false),
        },
      },
      reviver
    );
    console.log('PREPARE', retVal.toJS());
    return retVal;
  }

  function flushPendingHistoryLogEntry() {
    if (historyStateIsNotEmptyOrNoop(historyCandidateStateEntry)) {
      const historyEntry = prepareHistoryEntry({
        executeSelectionOffsets: historyCandidateExecuteSelectionOffsets,
        unexecuteSelectionOffsets: historyCandidateUnexecuteSelectionOffsets,
        historyState: [historyCandidateStateEntry],
      });
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

    const historyEntry = prepareHistoryEntry({
      executeSelectionOffsets,
      unexecuteSelectionOffsets,
      historyState: historyState.filter(historyStateIsNotEmptyOrNoop),
    });
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
    if (historyLog.length === 0) {
      // we're current, no new updates to save
      return {};
    }

    hasPendingRequest = true;
    const { error, data: result } = await apiClient.post(`/content/${postId}`, {
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
    console.info('Save Batch result', historyLog, result);
    historyLog = [];
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

export function getLastExecuteIdFromHistory(history) {
  return [...history].pop().executeState.get('id');
}
