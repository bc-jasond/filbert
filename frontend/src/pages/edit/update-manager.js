import { fromJS, List, Map } from 'immutable';

import {
  HISTORY_KEY_NODE_UPDATES,
  HISTORY_KEY_REDO_HISTORY,
  HISTORY_KEY_UNDO_HISTORY,
  NEW_POST_URL_ID,
  NODE_ACTION_DELETE,
  NODE_ACTION_UPDATE
} from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { get, set } from '../../common/local-storage';
import { moreThanNCharsAreDifferent } from '../../common/utils';
import { reviver } from './document-model';

const characterDiffSize = 6;

export default class UpdateManager {
  commitTimeoutId;

  lastUndoHistoryPush;

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
    return this.getPostIdNamespaceValue(HISTORY_KEY_REDO_HISTORY, List());
  }

  set redoHistory(value) {
    return this.setPostIdNamespaceValue(
      HISTORY_KEY_REDO_HISTORY,
      value.takeLast(100)
    );
  }

  get undoHistory() {
    return this.getPostIdNamespaceValue(HISTORY_KEY_UNDO_HISTORY, List());
  }

  set undoHistory(value) {
    return this.setPostIdNamespaceValue(
      HISTORY_KEY_UNDO_HISTORY,
      value.takeLast(100)
    );
  }

  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update =>
      update.set('post_id', postId)
    );
  }

  addToUndoHistory(nodeUpdate, selectionOffsets) {
    const add = () => {
      this.lastUndoHistoryPush = Date.now();
      this.undoHistory = this.undoHistory.push(
        Map({ nodeUpdate, selectionOffsets })
      );
    };
    this.redoHistory = List();
    // add to the undo history if...
    // it's been long enough
    if (
      !this.lastUndoHistoryPush ||
      this.undoHistory.length === 0 ||
      Date.now() - this.lastUndoHistoryPush > 30000
    ) {
      console.info("addToUndoHistory - it's been long enough");
      add();
      return;
    }
    
    // user added / removed one or more nodes
    const lastHistory = this.undoHistory.last(Map());
    const mostRecent = lastHistory.get('nodesById', Map());
    const merged = mostRecent.merge(nodesById);
    // TODO: this doesn't account for highlighting n nodes and pasting in n new nodes
    if (Math.abs(merged.size - mostRecent.size) > 0) {
      console.info('addToUndoHistory - user added / removed one or more nodes');
      add();
      return;
    }
    // O(n) operation on the number of nodes in the document... :(
    // we know by here that only 1 node changed
    const mostRecentNode = mostRecent
      .filter((node, id) => !node.equals(merged.get(id)))
      .first();
    if (!mostRecentNode) {
      return;
    }
    const updatedNode = nodesById.get(mostRecentNode.get('id'));
    if (updatedNode.get('type') !== mostRecentNode.get('type')) {
      console.info('addToUndoHistory - one node changed TYPE');
      add();
      return;
    }
    if (!updatedNode.get('meta').equals(mostRecentNode.get('meta'))) {
      console.info('addToUndoHistory - one node changed META');
      add();
      return;
    }
    if (
      moreThanNCharsAreDifferent(
        updatedNode.get('content'),
        mostRecentNode.get('content'),
        characterDiffSize
      )
    ) {
      console.info(
        `addToUndoHistory - one node changed more than ${characterDiffSize} characters in CONTENT`
      );
      add();
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

  nodeHasBeenStagedForDelete(searchNodeId) {
    return !!this.nodeUpdates.find(
      (update, nodeId) =>
        nodeId === searchNodeId && update.get('action') === NODE_ACTION_DELETE
    );
  }

  saveContentBatch = async documentModel => {
    try {
      const updated = this.updates(documentModel);
      if (updated.length === 0) return;
      // console.info('Save Batch', updated);
      const result = await apiPost('/content', updated);
      // TODO: save these and retry X times
      this.clearUpdates();
      console.info('Save Batch result', result);
    } catch (err) {
      // TODO: retry, rollback after X times
      console.error('Content Batch Update Error: ', err);
    }
  };

  saveContentBatchDebounce = documentModel => {
    console.info('Batch Debounce');
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(
      () => this.saveContentBatch(documentModel),
      750
    );
  };

  stageNodeDelete(node) {
    if (!node || node.size === 0 || ['null','undefined'].includes(nodeId.get('id'))) {
      console.error('stageNodeDelete - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE) {
      // TODO: ensure this is saved in history before replacing it
      console.info('stageNodeDelete - deleting an updated node ', nodeId);
    } else {
      console.info('stageNodeDelete ', nodeId);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') })
    );
  }

  stageNodeUpdate(node) {
    if (!node || node.size === 0 || ['null','undefined'].includes(nodeId.get('id'))) {
      console.error('stageNodeUpdate - bad node', node);
      return;
    }
    const nodeId = node.get('id');
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_DELETE) {
      // TODO: ensure this is saved in history before replacing it
      console.info('stageNodeUpdate - updating a deleted node ', nodeId);
    } else {
      console.info('stageNodeUpdate ', nodeId);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id'), node })
    );
  }

  undoRedo(current, selectionOffsets, shouldUndo = true) {
    const key = shouldUndo
      ? HISTORY_KEY_UNDO_HISTORY
      : HISTORY_KEY_REDO_HISTORY;
    const otherKey = shouldUndo
      ? HISTORY_KEY_REDO_HISTORY
      : HISTORY_KEY_UNDO_HISTORY;
    const lastHistoryEntry = this[key].last(Map());
    const mostRecent = lastHistoryEntry.get('nodesById', Map());
    const mostRecentOffsets = lastHistoryEntry.get('selectionOffsets', Map());
    this[key] = this[key].pop();
    if (mostRecent.size === 0) {
      return Map();
    }
    this[otherKey] = this[otherKey].push(
      fromJS({ nodesById: current, selectionOffsets }, reviver)
    );
    
    //this.diff(current, mostRecent);
      // TODO: flush updates first?
      this.clearUpdates();
      current.merge(next).forEach(node => {
        const nodeId = node.get('id');
        const currentNode = current.get(nodeId);
        const nextNode = next.get(nodeId);
        if (
          // update
          (currentNode && nextNode && !nextNode.equals(currentNode)) ||
          // insert
          !currentNode
        ) {
          this.stageNodeUpdate(nodeId);
          return;
        }
        if (!nextNode) {
          this.stageNodeDelete(nodeId);
        }
      });
    
    return fromJS(
      { nodesById: mostRecent, selectionOffsets: mostRecentOffsets },
      reviver
    );
  }

  /**
   * 1) validates that a node with "nodeId" exists in the document model
   * 2) grabs the current state of node with "nodeId" at the time of this call - destructive editing without a concept of history
   *
   * TODO: for undo/redo #2 will need to move up into the calls to stageNodeForUpdate(), this will require a
   *  a rolling delta approach
   */
  updates(documentModel) {
    return Object.entries(
      this.nodeUpdates
        // don't send bad updates
        .filterNot(
          (update, nodeId) =>
            update.get('action') === NODE_ACTION_UPDATE &&
            documentModel.getNode(nodeId).size === 0
        )
        // don't look for deleted nodes...
        .map((update, nodeId) =>
          update.get('action') === NODE_ACTION_DELETE
            ? update
            : update.set('node', documentModel.getNode(nodeId))
        )
        .toJS()
    );
  }
}
