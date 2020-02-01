import { fromJS, List, Map } from 'immutable';

import DocumentModel, { reviver } from './document-model';
import {
  HISTORY_KEY_NODE_UPDATES,
  HISTORY_KEY_REDO,
  HISTORY_KEY_REDO_OFFSETS,
  HISTORY_KEY_REDO_UPDATES,
  HISTORY_KEY_UNDO,
  HISTORY_KEY_UNDO_OFFSETS,
  HISTORY_KEY_UNDO_UPDATES,
  NEW_POST_URL_ID,
  NODE_ACTION_DELETE,
  NODE_ACTION_UPDATE,
  SELECTION_LINK_URL
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { get, set } from '../../common/local-storage';
import { moreThanNCharsAreDifferent, nodeIsValid } from '../../common/utils';

const characterDiffSize = 6;

export default class UpdateManager {
  commitTimeoutId;

  // cache last node for text changes, so we don't add a history entry for every keystroke
  lastUndoHistoryNode = Map();

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

  get nodeUpdates() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_NODE_UPDATES, Map());
  }

  set nodeUpdates(value) {
    return this.setPostIdNamespaceValue(HISTORY_KEY_NODE_UPDATES, value);
  }

  get redoHistory() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_REDO, List());
  }

  set redoHistory(value) {
    return this.setPostIdNamespaceValue(HISTORY_KEY_REDO, value.takeLast(100));
  }

  get undoHistory() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_UNDO, List());
  }

  set undoHistory(value) {
    return this.setPostIdNamespaceValue(HISTORY_KEY_UNDO, value.takeLast(100));
  }

  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update =>
      update.set('post_id', postId)
    );
  }

  addToUndoHistory(prevNodesById, prevSelectionOffsets, selectionOffsets) {
    // always clear redoHistory list since it would require a merge strategy to maintain
    this.redoHistory = List();
    // "reverse" the current updates list to get an "undo" list
    // for text content changes - only add to history after N characters are different
    const newHistoryEntry = this.nodeUpdates
      .map((update, nodeId) => {
        const prevNode = prevNodesById.get(nodeId);
        // insert (update in nodeUpdates not present in prevNodesById) -> delete
        // we inserted a new node, delete it (we'll update next_sibling_id for it's previous node below)
        if (!prevNode) {
          return update.set('action', NODE_ACTION_DELETE).delete('node');
        }
        // delete -> update
        // if we just deleted this node, add it back
        if (update.get('action') === NODE_ACTION_DELETE) {
          return update.set('action', NODE_ACTION_UPDATE).set('node', prevNode);
        }
        const updatedNode = update.get('node');
        // update - update
        // if it's "structural" ('type', 'next_sibling_id', or certain changes to 'meta') - add it
        if (
          // node type changed
          updatedNode.get('type') !== prevNode.get('type') ||
          // node position in document changed
          updatedNode.get('next_sibling_id') !==
            prevNode.get('next_sibling_id') ||
          // node meta data changed structure
          updatedNode.get('meta', Map()).size !==
            prevNode.get('meta', Map()).size ||
          // node meta,selections changed structure
          updatedNode.getIn(['meta', 'selections'], List()).size !==
            prevNode.getIn(['meta', 'selections'], List()).size
        ) {
          return update.set('node', prevNode);
        }
        // At this point, changes should be local to one text content field of one node.
        // Cache the node to refer back to on subsequent diff checks (for each keystroke on the same node)
        if (this.lastUndoHistoryNode.get('id') !== nodeId) {
          this.lastUndoHistoryNode = prevNode;
          this.lastUndoHistoryOffsets = prevSelectionOffsets;
        }
        // node content can live in a few different places: ('content', ['meta':'url', 'caption', 'author', 'context', 'quote'], ['meta':'selections':N:'linkUrl'] - add if enough characters changed
        // find first field that changed and see if it meets the threshold
        if (
          // text content in 'content' changed enough
          moreThanNCharsAreDifferent(
            updatedNode.get('content'),
            this.lastUndoHistoryNode.get('content'),
            characterDiffSize
          ) ||
          // text content in 'meta' fields changed enough
          List(['url', 'caption', 'author', 'context', 'quote'])
            .filter(keyName =>
              moreThanNCharsAreDifferent(
                updatedNode.getIn(['meta', keyName], ''),
                this.lastUndoHistoryNode.getIn(['meta', keyName], ''),
                characterDiffSize
              )
            )
            .first() ||
          // linkUrl in a selection changed enough
          updatedNode
            .getIn(['meta', 'selections'], List())
            .filter((updatedSelection, idx) =>
              moreThanNCharsAreDifferent(
                updatedSelection.get(SELECTION_LINK_URL, ''),
                this.lastUndoHistoryNode.getIn(
                  ['meta', 'selections', idx, SELECTION_LINK_URL],
                  ''
                ),
                characterDiffSize
              )
            )
            .first()
        ) {
          const updateWithNewNode = update.set(
            'node',
            this.lastUndoHistoryNode
          );
          this.lastUndoHistoryNode = Map();
          this.lastUndoHistoryOffsets = undefined;
          return updateWithNewNode;
        }
        return Map();
      })
      // remove empty Map()s
      .filter(update => update.get('action'));

    if (newHistoryEntry.size > 0) {
      this.undoHistory = this.undoHistory.push(
        Map({
          // execute == 'undo'
          executeUpdates: newHistoryEntry,
          executeOffsets: this.lastUndoHistoryOffsets || prevSelectionOffsets,
          // unexecute == 'redo'
          unexecuteUpdates: this.nodeUpdates,
          unexecuteOffsets: selectionOffsets
        })
      );
    }
  }

  clearUpdates() {
    if (this.nodeUpdates.size > 0) {
      console.info(
        'clearUpdates - clearing non-empty update pipeline',
        this.nodeUpdates
      );
    }
    this.nodeUpdates = Map();
  }

  init(post) {
    this.post = fromJS(post);
    /* eslint-disable prefer-destructuring, no-self-assign */
    // side-effectful getters to init from localStorage
    this.nodeUpdates = this.nodeUpdates;
    this.undoHistory = this.undoHistory;
    this.redoHistory = this.redoHistory;
    /* eslint-enable prefer-destructuring, no-self-assign */
  }

  saveContentBatch = async () => {
    const updated = Object.entries(this.nodeUpdates.toJS());
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
      this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE
    ) {
      // TODO: ensure this is saved in history before replacing it ?
      console.info('stageNodeDelete - deleting an updated node ', node);
    } else {
      console.info('stageNodeDelete ', node);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') })
    );
  }

  stageNodeUpdate(node) {
    if (!nodeIsValid(node)) {
      console.error('stageNodeUpdate - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    if (
      this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_DELETE
    ) {
      // TODO: ensure this is saved in history before replacing it ?;
      console.info('stageNodeUpdate - updating a deleted node ', nodeId);
    } else {
      console.info('stageNodeUpdate ', nodeId);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id'), node })
    );
  }

  applyUpdates(updates, nodesById) {
    let updatedNodesById = nodesById;
    updates.forEach((update, nodeId) => {
      if (update.get('action') === NODE_ACTION_DELETE) {
        updatedNodesById = updatedNodesById.delete(nodeId);
      } else {
        updatedNodesById = updatedNodesById.set(nodeId, update.get('node'));
      }
    });
    // TODO: clear or merge?
    this.clearUpdates();
    this.nodeUpdates = updates;
    return updatedNodesById;
  }

  undo(currentNodesById) {
    const lastHistoryEntry = this[HISTORY_KEY_UNDO].last(Map());
    const undoUpdates = lastHistoryEntry.get(HISTORY_KEY_UNDO_UPDATES, Map());
    const undoOffsets = lastHistoryEntry.get(HISTORY_KEY_UNDO_OFFSETS, Map());
    this[HISTORY_KEY_UNDO] = this[HISTORY_KEY_UNDO].pop();
    if (undoUpdates.size === 0) {
      return Map();
    }
    // since history objects are self-contained with both undo and redo data
    // we just move them back and forth between undo / redo stacks
    this[HISTORY_KEY_REDO] = this[HISTORY_KEY_REDO].push(lastHistoryEntry);

    const updatedNodesById = this.applyUpdates(undoUpdates, currentNodesById);

    return fromJS(
      { nodesById: updatedNodesById, selectionOffsets: undoOffsets },
      reviver
    );
  }

  redo(currentNodesById) {
    const lastHistoryEntry = this[HISTORY_KEY_REDO].last(Map());
    const redoUpdates = lastHistoryEntry.get(HISTORY_KEY_REDO_UPDATES, Map());
    const redoOffsets = lastHistoryEntry.get(HISTORY_KEY_REDO_OFFSETS, Map());
    this[HISTORY_KEY_REDO] = this[HISTORY_KEY_REDO].pop();
    if (redoUpdates.size === 0) {
      return Map();
    }
    // since history objects are self-contained with both undo and redo data
    // we just move them back and forth between undo / redo stacks
    this[HISTORY_KEY_UNDO] = this[HISTORY_KEY_UNDO].push(lastHistoryEntry);

    const updatedNodesById = this.applyUpdates(redoUpdates, currentNodesById);

    return fromJS(
      { nodesById: updatedNodesById, selectionOffsets: redoOffsets },
      reviver
    );
  }
}
