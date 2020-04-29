import { fromJS, List, Map, is } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_REDO,
  HISTORY_KEY_STATE,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
  NEW_POST_URL_ID,
  NODE_ACTION_DELETE,
  NODE_ACTION_UPDATE,
  NODE_UPDATE_HISTORY,
  NODE_UPDATE_HISTORY_CURRENT_POSITION,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { get, set } from '../../common/local-storage';
import {
  moreThanNCharsAreDifferent,
  nodeIsValid,
  reviver,
} from '../../common/utils';

export const characterDiffSize = 6;

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
    set(getKey(key), value);
  }

  function getNodeUpdateLog() {
    return getPostIdNamespaceValue(NODE_UPDATE_HISTORY, List());
  }

  function setNodeUpdateLog(value) {
    return setPostIdNamespaceValue(NODE_UPDATE_HISTORY, value.takeLast(100));
  }

  function getHistoryCurrentPosition() {
    return getPostIdNamespaceValue(HISTORY_KEY_REDO, 0);
  }

  function setHistoryCurrentPosition(value) {
    return setPostIdNamespaceValue(HISTORY_KEY_REDO, value);
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
    // clear placeholder updates
    setNodeUpdateLog(List());
  }

  function appendToNodeUpdateLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    state,
  }) {
    const historyEntry = Map({
      id: getNextId(),
      [HISTORY_KEY_EXECUTE_OFFSETS]: executeSelectionOffsets,
      [HISTORY_KEY_UNEXECUTE_OFFSETS]: unexecuteSelectionOffsets,
      [HISTORY_KEY_STATE]: state.filter(
        // remove no-op state entries
        ({ executeState, unexecuteState }) => !is(executeState, unexecuteState)
      ),
    });
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    const historyAfterAppend = getNodeUpdateLog().push(historyEntry);
    setNodeUpdateLog(historyAfterAppend);
    // use size as history id
    return historyAfterAppend.size;
  }

  async function saveContentBatch() {
    const lastSavedPosition = getHistoryCurrentPosition();
    let updated = getNodeUpdateLog();
    updated = updated.filter(
      (logEntry) => logEntry.get('id') > lastSavedPosition
    );
    updated = updated.toJS();
    if (updated.length === 0) return;
    // console.info('Save Batch', updated);
    const { error, data: result } = await apiPost('/content', {
      postId,
      historyLogEntries: updated,
    });
    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return;
    }
    const { id: newHistoryCurrentPosition } = updated.pop();
    setHistoryCurrentPosition(newHistoryCurrentPosition);
    console.info(
      'Save Batch result',
      lastSavedPosition,
      updated,
      newHistoryCurrentPosition,
      result
    );
  }

  let commitTimeoutId;

  function saveContentBatchDebounce() {
    console.info('Batch Debounce');
    clearTimeout(commitTimeoutId);
    commitTimeoutId = setTimeout(saveContentBatch, 750);
  }

  let historyCandidateNode = Map();
  let historyCandidateSelectionOffsets = {};
  let historyCandidateState = {};
  let historyCandidateTimeout;

  function appendToNodeUpdateLogWhenNCharsAreDifferent({
    unexecuteSelectionOffsets,
    executeSelectionOffsets,
    state,
    comparisonPath,
  }) {
    if (state.length > 1) {
      throw new Error('how to handle NChars with state.length > 1?');
    }
    // compare last node in history state
    const {
      unexecuteState: nodeBeforeUpdate,
      executeState: nodeAfterUpdate,
    } = [...state].pop();
    // always update the "execute" state
    historyCandidateState.executeState = nodeAfterUpdate;
    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(() => {
      appendToNodeUpdateLog({
        unexecuteSelectionOffsets: historyCandidateSelectionOffsets,
        executeSelectionOffsets,
        state: [historyCandidateState],
      });
      saveContentBatch();
    }, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateNode.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateNode.get('id')) {
        // make history entry for existing changes before tracking new node
        appendToNodeUpdateLog({
          unexecuteSelectionOffsets: historyCandidateSelectionOffsets,
          executeSelectionOffsets,
          state: [historyCandidateState],
        });
      }
      historyCandidateNode = nodeBeforeUpdate; // this node matches the state in state.unexecuteState OR "before" documentModel.update()
      historyCandidateSelectionOffsets = unexecuteSelectionOffsets;
      historyCandidateState = [...state].pop();
    }

    // TODO: get document state (selectedNodeMap) and add to history list here
    if (
      moreThanNCharsAreDifferent(
        nodeAfterUpdate.getIn(comparisonPath, ''),
        historyCandidateNode.getIn(comparisonPath, '')
      )
    ) {
      appendToNodeUpdateLog({
        unexecuteSelectionOffsets: historyCandidateSelectionOffsets,
        executeSelectionOffsets,
        state: [historyCandidateState],
      });
      // unset cached node
      historyCandidateNode = Map();
    }
  }

  function applyUpdates(updates, offsets, nodesById) {
    /* let updatedNodesById = nodesById;
    updates.forEach((update, nodeId) => {
      if (update.get('action') === NODE_ACTION_DELETE) {
        updatedNodesById = updatedNodesById.delete(nodeId);
      } else {
        updatedNodesById = updatedNodesById.set(nodeId, update.get('node'));
      }
    });
    // TODO: when updates are "append only", then here we'll flush them to the update save queue

    return fromJS(
      { nodesById: updatedNodesById, selectionOffsets: offsets },
      reviver
    ); */
  }

  function undo(currentNodesById) {
    /* const lastHistoryEntry = getHistoryUndo().last(Map());
    const updates = lastHistoryEntry.get(HISTORY_KEY_UNEXECUTE_STATES, Map());
    const offsets = lastHistoryEntry.get(HISTORY_KEY_UNEXECUTE_OFFSETS, Map());
    setHistoryUndo(getHistoryUndo().pop());
    if (updates.size === 0) {
      return Map();
    }
    // since history objects are self-contained with both undo and redo data
    // we just move them back and forth between undo / redo stacks
    setHistoryRedo(getHistoryRedo().push(lastHistoryEntry));

    // apply updates
    return applyUpdates(updates, offsets, currentNodesById); */
  }

  function redo(currentNodesById) {
    /* const lastHistoryEntry = getHistoryRedo().last(Map());
    const updates = lastHistoryEntry.get(HISTORY_KEY_EXECUTE_STATES, Map());
    const offsets = lastHistoryEntry.get(HISTORY_KEY_EXECUTE_STATES, Map());
    setHistoryRedo(getHistoryRedo().pop());
    if (updates.size === 0) {
      return Map();
    }
    // since history objects are self-contained with both undo and redo data
    // we just move them back and forth between undo / redo stacks #commandpattern
    setHistoryUndo(getHistoryUndo().push(lastHistoryEntry));

    // apply updates
    return applyUpdates(updates, offsets, currentNodesById); */
  }

  return {
    copyPlaceholderPostUpdateLogToPostIdNamespace,
    saveContentBatch,
    saveContentBatchDebounce,
    appendToNodeUpdateLog,
    appendToNodeUpdateLogWhenNCharsAreDifferent,
    undo,
    redo,
  };
}

export function getLastExecuteIdFromHistory(history) {
  return [...history].pop().executeState.get('id');
}
