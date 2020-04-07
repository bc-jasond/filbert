import { fromJS, List, Map } from 'immutable';

import {
  HISTORY_KEY_REDO,
  HISTORY_KEY_REDO_OFFSETS,
  HISTORY_KEY_REDO_UPDATES,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_UNDO_OFFSETS,
  HISTORY_KEY_UNDO_UPDATES,
  NEW_POST_URL_ID,
  NODE_ACTION_DELETE,
  NODE_ACTION_UPDATE,
  NODE_UPDATES,
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { get, set } from '../../common/local-storage';
import { nodeIsValid, reviver } from '../../common/utils';

export const characterDiffSize = 6;

export default class UpdateManager {
  commitTimeoutId;

  lastUndoHistoryOffsets;

  post = Map();

  getKey(key) {
    return `${this.post.get('id', NEW_POST_URL_ID)}-${key}`;
  }

  getPostIdNamespaceValue(key, defaultValue) {
    // if (this.post.size === 0) return defaultValue;
    return get(this.getKey(key), defaultValue);
  }

  setPostIdNamespaceValue(key, value) {
    set(this.getKey(key), value);
    return this;
  }

  get [NODE_UPDATES]() {
    return this.getPostIdNamespaceValue(NODE_UPDATES, Map());
  }

  set [NODE_UPDATES](value) {
    return this.setPostIdNamespaceValue(NODE_UPDATES, value);
  }

  get [HISTORY_KEY_REDO]() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_REDO, List());
  }

  set [HISTORY_KEY_REDO](value) {
    return this.setPostIdNamespaceValue(HISTORY_KEY_REDO, value.takeLast(100));
  }

  get [HISTORY_KEY_UNDO]() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_UNDO, List());
  }

  set [HISTORY_KEY_UNDO](value) {
    return this.setPostIdNamespaceValue(HISTORY_KEY_UNDO, value.takeLast(100));
  }

  addPostIdToUpdates(postId) {
    this[NODE_UPDATES] = this[NODE_UPDATES].map((update) =>
      update.set('post_id', postId)
    );
  }

  addToUndoHistory(prevNodesById, prevSelectionOffsets, selectionOffsets) {
    // always clear redoHistory list since it would require a merge strategy to maintain
    this[HISTORY_KEY_REDO] = List();
    // "reverse" the current updates list to get an "undo" list
    // for text content changes - only add to history after N characters are different
    const newHistoryEntry = this[NODE_UPDATES].map((update, nodeId) => {
      const prevNode = prevNodesById.get(nodeId);
      // insert (update in nodeUpdates not present in prevNodesById) -> delete
      // we inserted a new node, delete it (we'll update next_sibling_id for it's previous node in the "structure" check below)
      if (!prevNode) {
        return update.set('action', NODE_ACTION_DELETE).delete('node');
      }
      // delete -> update
      // if we just deleted this node, add it back
      if (update.get('action') === NODE_ACTION_DELETE) {
        return update.set('action', NODE_ACTION_UPDATE).set('node', prevNode);
      }
      // update -> update
      // Simplify this for now - all updates get history entries.  This means a history entry for every keystroke.
      // Trying to optimize this for space is causing fundamental issues.  My new stance is to "save too much" and
      // then have a job merge and delete redundant records (TODO later)
      return update.set('node', prevNode);
    });

    if (newHistoryEntry.size > 0) {
      const historyEntry = Map({
        // execute == 'undo'
        [HISTORY_KEY_UNDO_UPDATES]: newHistoryEntry,
        [HISTORY_KEY_UNDO_OFFSETS]: prevSelectionOffsets,
        // unexecute == 'redo'
        [HISTORY_KEY_REDO_UPDATES]: this[NODE_UPDATES],
        [HISTORY_KEY_REDO_OFFSETS]: selectionOffsets,
      });
      console.info('HISTORY: adding to undo history', historyEntry.toJS());
      this[HISTORY_KEY_UNDO] = this[HISTORY_KEY_UNDO].push(historyEntry);
    }
  }

  clearUpdates() {
    if (this[NODE_UPDATES].size > 0) {
      console.info(
        'clearUpdates - clearing non-empty update pipeline',
        this[NODE_UPDATES]
      );
    }
    this[NODE_UPDATES] = Map();
  }

  init(post) {
    this.post = fromJS(post);
    /* eslint-disable prefer-destructuring, no-self-assign */
    // side-effectful getters to init from localStorage
    this[NODE_UPDATES] = this[NODE_UPDATES];
    this[HISTORY_KEY_UNDO] = this[HISTORY_KEY_UNDO];
    this[HISTORY_KEY_REDO] = this[HISTORY_KEY_REDO];
    /* eslint-enable prefer-destructuring, no-self-assign */
  }

  saveContentBatch = async () => {
    const updated = Object.entries(this[NODE_UPDATES].toJS());
    if (updated.length === 0) return;
    // console.info('Save Batch', updated);
    const { error, data: result } = await apiPost('/content', updated);
    if (error) {
      // TODO: retry, rollback after X times
      console.error('Content Batch Update Error: ', error);
      return;
    }
    // TODO: save these and retry X times
    this.clearUpdates();
    console.info('Save Batch result', result);
  };

  saveContentBatchDebounce = () => {
    console.info('Batch Debounce');
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(() => this.saveContentBatch(), 750);
  };

  stageNodeDelete(node) {
    if (!nodeIsValid(node)) {
      console.error('stageNodeDelete - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    if (
      this[NODE_UPDATES].get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE
    ) {
      // TODO: ensure this is saved in history before replacing it ?
      console.info('stageNodeDelete - deleting an updated node ', node);
    } else {
      console.info('stageNodeDelete ', node);
    }
    this[NODE_UPDATES] = this[NODE_UPDATES].set(
      nodeId,
      Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') })
    );
    // TODO: check for a previous node to update it's
  }

  stageNodeUpdate(node) {
    if (!nodeIsValid(node)) {
      console.error('stageNodeUpdate - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    if (
      this[NODE_UPDATES].get(nodeId, Map()).get('action') === NODE_ACTION_DELETE
    ) {
      // TODO: ensure this is saved in history before replacing it ?;
      console.info('stageNodeUpdate - updating a deleted node ', nodeId);
    } else {
      console.info('stageNodeUpdate ', nodeId);
    }
    this[NODE_UPDATES] = this[NODE_UPDATES].set(
      nodeId,
      Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id'), node })
    );
  }

  internalUndo(currentNodesById, shouldUndo = true) {
    const historyKey = shouldUndo ? HISTORY_KEY_UNDO : HISTORY_KEY_REDO;
    const otherKey = shouldUndo ? HISTORY_KEY_REDO : HISTORY_KEY_UNDO;
    const updatesKey = shouldUndo
      ? HISTORY_KEY_UNDO_UPDATES
      : HISTORY_KEY_REDO_UPDATES;
    const offsetsKey = shouldUndo
      ? HISTORY_KEY_UNDO_OFFSETS
      : HISTORY_KEY_REDO_OFFSETS;
    const lastHistoryEntry = this[historyKey].last(Map());
    const updates = lastHistoryEntry.get(updatesKey, Map());
    const offsets = lastHistoryEntry.get(offsetsKey, Map());
    this[historyKey] = this[historyKey].pop();
    if (updates.size === 0) {
      return Map();
    }
    // since history objects are self-contained with both undo and redo data
    // we just move them back and forth between undo / redo stacks
    this[otherKey] = this[otherKey].push(lastHistoryEntry);

    // apply updates
    let updatedNodesById = currentNodesById;
    updates.forEach((update, nodeId) => {
      if (update.get('action') === NODE_ACTION_DELETE) {
        updatedNodesById = updatedNodesById.delete(nodeId);
      } else {
        updatedNodesById = updatedNodesById.set(nodeId, update.get('node'));
      }
    });
    // TODO: I think updates need to merge here...
    this.clearUpdates();
    this[NODE_UPDATES] = updates;

    return fromJS(
      { nodesById: updatedNodesById, selectionOffsets: offsets },
      reviver
    );
  }

  undo(currentNodesById) {
    return this.internalUndo(currentNodesById);
  }

  redo(currentNodesById) {
    return this.internalUndo(currentNodesById, false);
  }
}
