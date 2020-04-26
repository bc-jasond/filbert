import { fromJS, List, Map } from 'immutable';

import {
  HISTORY_KEY_EXECUTE_OFFSETS,
  HISTORY_KEY_EXECUTE_STATES,
  HISTORY_KEY_REDO,
  HISTORY_KEY_STATE,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_UNEXECUTE_OFFSETS,
  HISTORY_KEY_UNEXECUTE_STATES,
  NODE_ACTION_DELETE,
  NODE_ACTION_UPDATE,
  NODE_UPDATE_HISTORY,
  NODE_UPDATE_QUEUE,
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

  function getPostIdNamespaceValue(key, defaultValue) {
    return get(getKey(key), defaultValue);
  }

  function setPostIdNamespaceValue(key, value) {
    set(getKey(key), value);
  }

  function getNodeUpdateQueue() {
    getPostIdNamespaceValue(NODE_UPDATE_QUEUE, List());
  }
  function setNodeUpdateQueue(value) {
    setPostIdNamespaceValue(NODE_UPDATE_QUEUE, value);
  }

  function getNodeUpdateLog() {
    return getPostIdNamespaceValue(NODE_UPDATE_HISTORY, List());
  }

  function setNodeUpdateLog(value) {
    return setPostIdNamespaceValue(NODE_UPDATE_HISTORY, value);
  }

  function getHistoryRedo() {
    return getPostIdNamespaceValue(HISTORY_KEY_REDO, List());
  }

  function setHistoryRedo(value) {
    return setPostIdNamespaceValue(HISTORY_KEY_REDO, value.takeLast(100));
  }

  function getHistoryUndo() {
    return getPostIdNamespaceValue(HISTORY_KEY_UNDO, List());
  }

  function setHistoryUndo(value) {
    return setPostIdNamespaceValue(HISTORY_KEY_UNDO, value.takeLast(100));
  }

  function addPostIdToUpdates(postIdInternal) {
    setNodeUpdateLog(
      getNodeUpdateLog().map((update) => update.set('post_id', postIdInternal))
    );
  }

  function appendToNodeUpdateLog({
    executeSelectionOffsets,
    unexecuteSelectionOffsets,
    state,
  }) {
    const historyEntry = Map({
      [HISTORY_KEY_EXECUTE_OFFSETS]: executeSelectionOffsets,
      [HISTORY_KEY_UNEXECUTE_OFFSETS]: unexecuteSelectionOffsets,
      [HISTORY_KEY_STATE]: state,
    });
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    setHistoryUndo(getHistoryUndo().push(historyEntry));
  }

  let historyCandidateNode = Map();
  let historyCandidateSelectionOffsets = {};
  let historyCandidateState = [];

  function appendToNodeUpdateLogWhenNCharsAreDifferent({
    unexecuteSelectionOffsets,
    executeSelectionOffsets,
    state,
    comparisonPath,
  }) {
    const {
      unexecuteState: nodeBeforeUpdate,
      executeState: nodeAfterUpdate,
    } = state;
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (historyCandidateNode.get('id') !== nodeAfterUpdate.get('id')) {
      if (historyCandidateNode.get('id')) {
        // make history entry for existing changes before tracking new node
        appendToNodeUpdateLog({
          unexecuteSelectionOffsets: historyCandidateSelectionOffsets,
          executeSelectionOffsets,
          state: historyCandidateState,
        });
      }
      historyCandidateNode = nodeBeforeUpdate; // this node matches the state in state.unexecuteState OR "before" documentModel.update()
      historyCandidateSelectionOffsets = unexecuteSelectionOffsets;
      historyCandidateState = state;
    }

    // TODO: get document state (selectedNodeMap) and add to history list here
    if (
      moreThanNCharsAreDifferent(
        nodeAfterUpdate.getIn(comparisonPath),
        historyCandidateNode.get(comparisonPath)
      )
    ) {
      appendToNodeUpdateLog({
        unexecuteSelectionOffsets: historyCandidateSelectionOffsets,
        executeSelectionOffsets,
        state: historyCandidateState,
      });
    }
  }

  function clearUpdates() {
    if (getNodeUpdateLog().size > 0) {
      console.info(
        'clearUpdates - clearing non-empty update pipeline',
        getNodeUpdateLog()
      );
    }
    setNodeUpdateLog(Map());
  }

  async function saveContentBatch() {
    const updated = Object.entries(getNodeUpdateLog().toJS());
    if (updated.length === 0) return;
    // console.info('Save Batch', updated);
    const { error, data: result } = await apiPost('/content', updated);
    if (error) {
      // TODO: retry, rollback after X times
      console.error('Content Batch Update Error: ', error);
      return;
    }
    // TODO: save these and retry X times
    clearUpdates();
    console.info('Save Batch result', result);
  }

  let commitTimeoutId;

  function saveContentBatchDebounce() {
    console.info('Batch Debounce');
    clearTimeout(commitTimeoutId);
    commitTimeoutId = setTimeout(saveContentBatch, 750);
  }

  function stageNodeDelete() {}

  function stageNodeUpdate(node) {
    if (!nodeIsValid(node)) {
      console.error('stageNodeUpdate - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    setNodeUpdateLog(
      getNodeUpdateLog().set(
        nodeId,
        Map({ action: NODE_ACTION_UPDATE, post_id: postId, node })
      )
    );
  }

  function applyUpdates(updates, offsets, nodesById) {
    let updatedNodesById = nodesById;
    updates.forEach((update, nodeId) => {
      if (update.get('action') === NODE_ACTION_DELETE) {
        updatedNodesById = updatedNodesById.delete(nodeId);
      } else {
        updatedNodesById = updatedNodesById.set(nodeId, update.get('node'));
      }
    });
    // TODO: when updates are "append only", then here we'll flush them to the update save queue
    clearUpdates();
    setNodeUpdateLog(updates);

    return fromJS(
      { nodesById: updatedNodesById, selectionOffsets: offsets },
      reviver
    );
  }

  function undo(currentNodesById) {
    const lastHistoryEntry = getHistoryUndo().last(Map());
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
    return applyUpdates(updates, offsets, currentNodesById);
  }

  function redo(currentNodesById) {
    const lastHistoryEntry = getHistoryRedo().last(Map());
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
    return applyUpdates(updates, offsets, currentNodesById);
  }

  return {
    addPostIdToUpdates,
    clearUpdates,
    saveContentBatch,
    saveContentBatchDebounce,
    appendToNodeUpdateLog,
    appendToNodeUpdateLogWhenNCharsAreDifferent,
    stageNodeDelete,
    stageNodeUpdate,
    undo,
    redo,
  };
}

export function getLastExecuteIdFromHistory(history) {
  return history[history.length]?.executeState?.get?.('id');
}
