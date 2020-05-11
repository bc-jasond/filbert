import { fromJS, List, Map, is } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_UNDO_ID,
  HISTORY_KEY_STATE,
  HISTORY_KEY_LAST_SAVED_ID,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
  NEW_POST_URL_ID,
  NODE_ACTION_DELETE,
  NODE_UPDATE_HISTORY,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { get, set } from '../../common/local-storage';
import {
  moreThanNCharsAreDifferent,
  nodeIsValid,
  reviver,
} from '../../common/utils';

export const characterDiffSize = 6;

let historyCandidateNode = Map();
let historyCandidateUnexecuteSelectionOffsets = {};
let historyCandidateExecuteSelectionOffsets = {};
let historyCandidateStateEntry = {};
let historyCandidateTimeout;

export default function UpdateManager(postId) {
  function getKey(key) {
    return `${postId}-${key}`;
  }
  function getKeyOverride(key, postIdArg) {
    return `${postIdArg}-${key}`;
  }

  function getPostIdNamespaceValue(key, defaultValue) {
    return get(getKey(key), defaultValue);
  }

  function setPostIdNamespaceValue(key, value) {
    set(getKey(key), value, false);
  }

  function getNodeUpdateLog(shouldIncludeDeletedEntries = true) {
    const allEntries = getPostIdNamespaceValue(NODE_UPDATE_HISTORY, List());
    return shouldIncludeDeletedEntries
      ? allEntries
      : allEntries.filter((entry) => !entry.get('deleted'));
  }

  function setNodeUpdateLog(value) {
    return setPostIdNamespaceValue(NODE_UPDATE_HISTORY, value);
  }

  // assume if there's a "created" date it means saved in DB
  // assume there's always at least one history entry with id 1
  function getHistoryLastSavedId() {
    /* TODO: sync with DB, for now just increment (only works with one client)
    const firstHistoryId = getNodeUpdateLog().first(Map()).get('id', 1);
    return getNodeUpdateLog()
      .findLast(({ created }) => created, null, Map())
      .get('id', firstHistoryId); */
    return getPostIdNamespaceValue(HISTORY_KEY_LAST_SAVED_ID, 0);
  }

  function setHistoryLastSavedId(value) {
    return setPostIdNamespaceValue(HISTORY_KEY_LAST_SAVED_ID, value);
  }

  // used to store cursor when using undo/redo.
  // current > -1 means we're in an undo state
  function getHistoryUndoId() {
    const current = getPostIdNamespaceValue(HISTORY_KEY_UNDO_ID, -1);
    if (current === -1) {
      return getNodeUpdateLog(false).last(Map()).get('id');
    }
    return current;
  }

  function setHistoryUndoId(value) {
    return setPostIdNamespaceValue(HISTORY_KEY_UNDO_ID, value);
  }

  function getLastActionWasUndo() {
    return getPostIdNamespaceValue('historyLastAction', false);
  }

  function setLastActionWasUndo(value) {
    return setPostIdNamespaceValue('historyLastAction', value);
  }

  function getNextId() {
    const lastId = getNodeUpdateLog().last(Map()).get('id', 0);
    return lastId + 1;
  }

  function copyPlaceholderPostUpdateLogToPostIdNamespace(postIdInternal) {
    set(
      getKeyOverride(NODE_UPDATE_HISTORY, postIdInternal),
      getNodeUpdateLog()
    );
  }

  function clearPending() {
    // clear cache
    historyCandidateNode = Map();
    historyCandidateUnexecuteSelectionOffsets = {};
    historyCandidateExecuteSelectionOffsets = {};
    historyCandidateStateEntry = {};
    clearTimeout(historyCandidateTimeout);
  }

  function flushPendingNodeUpdateLogEntry() {
    const id = getNextId();
    const historyEntry = fromJS(
      {
        id,
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
    const historyAfterAppend = getNodeUpdateLog().push(historyEntry);
    setNodeUpdateLog(historyAfterAppend);
    clearPending();
    return id;
  }

  function appendToNodeUpdateLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    state,
  }) {
    clearPending();
    const id = getNextId();
    const historyEntry = fromJS(
      {
        id,
        [HISTORY_KEY_EXECUTE_OFFSETS]: executeSelectionOffsets,
        [HISTORY_KEY_UNEXECUTE_OFFSETS]: unexecuteSelectionOffsets,
        [HISTORY_KEY_STATE]: state.filter(
          (entry) => !is(entry.executeState, entry.unexecuteState)
        ),
      },
      reviver
    );
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    const historyAfterAppend = getNodeUpdateLog().push(historyEntry);
    setNodeUpdateLog(historyAfterAppend);
    return id;
  }

  function historyEntryToNodeUpdate(history, shouldExecute = true) {
    const statesByNodeId = history.get(HISTORY_KEY_STATE).map((state) => {
      const unexecute = state.get(HISTORY_KEY_UNEXECUTE_STATES);
      const execute = state.get(HISTORY_KEY_EXECUTE_STATES);
      return shouldExecute
        ? // redo: if execute is falsy, it was a delete operation.  Use the unexecute id to delete
          execute || unexecute.get('id')
        : // undo: if unexecute is falsy it was an insert - mark node for delete by returning just the id
          unexecute || execute.get('id');
    });

    return shouldExecute
      ? statesByNodeId
      : // play updates in reverse for undo!
        statesByNodeId.reverse();
  }

  async function saveContentBatch(nodeUpdatesArg) {
    const lastSavedId = getHistoryLastSavedId();
    const nodeUpdatesByNodeId =
      nodeUpdatesArg ||
      getNodeUpdateLog()
        .filter((historyEntry) => historyEntry.get('id') > lastSavedId)
        // de-dupe happens on API
        .flatMap((historyEntry) => historyEntryToNodeUpdate(historyEntry))
        .toJS();
    if (nodeUpdatesByNodeId.length === 0) {
      // we're current, no new updates to save
      return;
    }
    // console.info('Save Batch', nodeUpdates);
    const { error, data: result } = await apiPost('/content', {
      postId,
      nodeUpdatesByNodeId,
    });
    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return;
    }
    const { id: newHistoryCurrentPosition } = nodeUpdatesByNodeId.pop();
    setHistoryLastSavedId(newHistoryCurrentPosition);
    console.info(
      'Save Batch result',
      lastSavedId,
      nodeUpdatesByNodeId,
      newHistoryCurrentPosition,
      result
    );
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

  function applyNodeUpdates(stateUpdatesByNodeId, offsets, nodesById) {
    let updatedNodesById = nodesById;

    stateUpdatesByNodeId.forEach((update) => {
      // an update will contain a whole node as Map()
      // a "delete" will contain just a node id string
      const currentIsDelete = typeof update === 'string';
      const updateId = currentIsDelete ? update : update.get('id');
      if (currentIsDelete) {
        updatedNodesById = updatedNodesById.delete(updateId);
        return;
      }
      updatedNodesById = updatedNodesById.set(updateId, update);
    });

    return fromJS(
      {
        stateUpdatesByNodeId,
        nodesById: updatedNodesById,
        selectionOffsets: offsets,
      },
      reviver
    );
  }

  function getPrevHistoryId(currentId) {
    const currentHistoryIdx = getNodeUpdateLog(false).findIndex(
      (entry) => entry.get('id') === currentId
    );
    // if switching between undo and redo, need to be careful with off-by-1 errors.
    // if the last action was 'undo' we need to move to the next history but, if it
    // was 'redo' we stay and apply the current unexecuteState before moving
    const nextHistoryIdx = currentHistoryIdx - (getLastActionWasUndo() ? 1 : 0);
    return getNodeUpdateLog(false)
      .get(Math.max(nextHistoryIdx, 0), Map())
      .get('id');
  }

  function undo(currentNodesById) {
    const undoHistoryId = getHistoryUndoId();
    const currentHistoryId = getPrevHistoryId(undoHistoryId);
    // at beginning?
    if (!currentHistoryId === 0) {
      return null;
    }
    const history = getNodeUpdateLog().find(
      (entry) => entry.get('id') === currentHistoryId
    );
    const unexecuteOffsets = history.get(HISTORY_KEY_UNEXECUTE_OFFSETS, Map());
    const unexecuteStatesByNodeId = historyEntryToNodeUpdate(history, false);

    if (unexecuteStatesByNodeId.size === 0) {
      return Map();
    }
    // update undo cursor position
    setHistoryUndoId(currentHistoryId);
    setLastActionWasUndo(true);

    // apply updates
    return applyNodeUpdates(
      unexecuteStatesByNodeId,
      unexecuteOffsets,
      currentNodesById
    );
  }

  function getNextHistoryId(currentId) {
    const currentHistoryIdx = getNodeUpdateLog(false).findIndex(
      (entry) => entry.get('id') === currentId
    );
    // if switching between undo and redo, need to be careful with off-by-1 errors.
    // if the last action was 'redo' we need to move to the next history but, if it
    // was 'undo' we stay and apply the current unexecuteState before moving
    const nextHistoryIdx = currentHistoryIdx + (getLastActionWasUndo() ? 0 : 1);
    return getNodeUpdateLog(false)
      .get(Math.min(nextHistoryIdx, getNodeUpdateLog(false).size), Map())
      .get('id');
  }

  function redo(currentNodesById) {
    const undoHistoryId = getHistoryUndoId();
    const currentHistoryId = getNextHistoryId(undoHistoryId);
    // at end?
    if (!currentHistoryId) {
      return null;
    }
    const history = getNodeUpdateLog().find(
      (entry) => entry.get('id') === currentHistoryId
    );
    const executeOffsets = history.get(HISTORY_KEY_EXECUTE_OFFSETS, Map());
    const executeStatesByNodeId = historyEntryToNodeUpdate(history);

    if (executeStatesByNodeId.length === 0) {
      return Map();
    }
    // update undo cursor position
    setHistoryUndoId(currentHistoryId);
    setLastActionWasUndo(false);

    // apply updates
    return applyNodeUpdates(
      executeStatesByNodeId,
      executeOffsets,
      currentNodesById
    );
  }

  if (postId === NEW_POST_URL_ID) {
    setNodeUpdateLog(List());
  }

  return {
    copyPlaceholderPostUpdateLogToPostIdNamespace,
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
