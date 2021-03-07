import immutable from 'immutable';
import { moreThanNCharsAreDifferent } from '@filbert/util';
import {
  LINKED_LIST_HEAD_ID,
  LINKED_LIST_NODES_MAP,
  getId,
} from '@filbert/linked-list';
import { meta } from '@filbert/document';

const { fromJS, Map } = immutable;

export function historyStateIsValid(historyLogEntries, nodesById) {
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
    let nextNode = historyLogEntries.get(nextId) ?? nodesById.get(nextId);
    return !nextNode ? false : walk(nextNode);
  }
  let valid = true;
  historyLogEntries.forEach((node, nodeId) => {
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

export function HistoryManager(postId, apiClient) {
  let historyCandidateLastSavedState = Map();
  let historyCandidateState = Map();
  let historyCandidateSelectionOffsets = {};
  let historyCandidateTimeout;
  let historyLog = [];
  let hasPendingRequest = false;

  function clearPending() {
    // clear cache
    historyCandidateState = Map();
    historyCandidateSelectionOffsets = {};
    clearTimeout(historyCandidateTimeout);
  }

  /**
   * history comes in as an array of execute states in order.  This function flattens the array into one state using last-wins
   * map of id => node
   *
   * @param Array historyLogEntries
   */
  function flattenHistory(historyLogEntries) {
    let lastHeadId;
    let nodesById = Map();
    // the document model is in charge of making sure that history entries arrive in the correct order
    // so we can just iterate applying updates and use last-wins to create an atomic update map keyed on nodeId
    // and a new head if it changed
    historyLogEntries.forEach(
      ({ [LINKED_LIST_HEAD_ID]: headId, [LINKED_LIST_NODES_MAP]: nodes }) => {
        lastHeadId = headId;
        nodes.forEach((nodeOrId) => {
          if (!nodeOrId) {
            console.error(historyLogEntries);
            throw new Error('history - invalid state');
          }
          const nodeId =
            typeof nodeOrId === 'string' ? nodeOrId : getId(nodeOrId);
          nodesById = nodesById.set(nodeId, nodeOrId);
        });
      }
    );
    return {
      [LINKED_LIST_HEAD_ID]: lastHeadId,
      [LINKED_LIST_NODES_MAP]: nodesById,
    };
  }

  function flushPendingHistoryLogEntry() {
    if (!getId(historyCandidateState)) {
      return;
    }
    const historyEntry = fromJS({
      selectionOffsets: historyCandidateSelectionOffsets,
      historyLogEntry: {
        [LINKED_LIST_HEAD_ID]: undefined,
        [LINKED_LIST_NODES_MAP]: {
          [getId(historyCandidateState)]: historyCandidateState,
        },
      },
    });
    console.info(
      'HISTORY PENDING: adding to node update history log',
      historyEntry.toJS()
    );
    historyLog.push(historyEntry);
    clearPending();
  }

  function appendToHistoryLog({ selectionOffsets, historyLogEntries }) {
    flushPendingHistoryLogEntry();
    if (!historyLogEntries) {
      return;
    }

    const historyEntry = fromJS({
      selectionOffsets,
      historyLogEntry: flattenHistory(historyLogEntries),
    });
    console.info(
      'HISTORY: adding to node update history log',
      historyEntry.toJS()
    );
    historyLog.push(historyEntry);
  }

  async function saveAndClearLocalHistoryLog(postIdOverride) {
    if (hasPendingRequest) {
      return { throttled: true };
    }
    if (historyLog.length === 0) {
      // we're current, no new updates to save
      return {};
    }

    hasPendingRequest = true;
    const { error, data: result } = await apiClient.post(
      `/content/${postIdOverride || postId}`,
      {
        contentNodeHistoryLog: historyLog,
      }
    );
    hasPendingRequest = false;

    if (error) {
      // TODO: message user after X failures?
      console.error('Content Batch Update Error: ', error);
      return { error };
    }
    // clear the pending history queue after successful save
    console.info('Save History Batch result', historyLog, result);
    historyLog = [];
    return fromJS(result);
  }

  function appendToHistoryLogWhenNCharsAreDifferent({
    selectionOffsets,
    historyLogEntries,
    comparisonKey,
  }) {
    if (historyLogEntries.length > 1) {
      throw new Error("I don't handle historyLogEntries with length > 1");
    }
    // compare last node in history historyLogEntries - there's only one node
    const [{ [LINKED_LIST_NODES_MAP]: nodes }] = historyLogEntries;
    if (nodes.size > 1) {
      throw new Error("I don't handle nodes with length > 1");
    }
    const nodeAfterUpdate = nodes.first();

    // always update the caret position
    historyCandidateSelectionOffsets = selectionOffsets;

    // save when user stops typing after a short wait - to make sure we don't lose the "last few chars"
    clearTimeout(historyCandidateTimeout);
    historyCandidateTimeout = setTimeout(flushPendingHistoryLogEntry, 3000);
    // update history if the node changes or if "more than N chars" have changed in the same node
    if (getId(historyCandidateState) !== getId(nodeAfterUpdate)) {
      if (getId(historyCandidateState)) {
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
        meta(historyCandidateState).get(comparisonKey),
        meta(historyCandidateLastSavedState).get(comparisonKey)
      )
    ) {
      flushPendingHistoryLogEntry();
    }
  }

  async function undoRedoInternal(isUndo = true) {
    const apiUrl = `/${isUndo ? 'undo' : 'redo'}/${postId}`;
    if (hasPendingRequest) {
      return Map({ throttled: true });
    }
    hasPendingRequest = true;
    const { error, data = {} } = await apiClient.post(apiUrl, {});
    hasPendingRequest = false;
    if (error) {
      console.error(error);
      return { error };
    }

    if (Map(data.nodesById).size === 0) {
      return {};
    }

    return data;
  }

  async function undo() {
    return undoRedoInternal();
  }

  async function redo() {
    return undoRedoInternal(false);
  }

  return {
    saveAndClearLocalHistoryLog,
    appendToHistoryLog,
    appendToHistoryLogWhenNCharsAreDifferent,
    undo,
    redo,
  };
}
