import Immutable, { Map } from 'immutable';

import { NODE_ACTION_DELETE, NODE_ACTION_UPDATE } from '../../common/constants';
import { apiPost } from '../../common/fetch';
import { moreThanNCharsAreDifferent } from '../../common/utils';

export default class UpdateManager {
  commitTimeoutId;

  lastUndoHistoryPush;

  nodeUpdates;

  post;

  redoHistory = [];

  undoHistory = [];

  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update =>
      update.set('post_id', postId)
    );
  }

  addToUndoHistory(nodesById) {
    const add = () => {
      this.lastUndoHistoryPush = Date.now();
      this.undoHistory.push(nodesById);
    };
    this.redoHistory = [];
    // add to the undo history if...
    // it's been long enough
    if (
      !this.lastUndoHistoryPush ||
      this.undoHistory.length === 0 ||
      Date.now() - this.lastUndoHistoryPush > 30000
    ) {
      console.debug("addToUndoHistory - it's been long enough");
      add();
      return;
    }
    // user added / removed one or more nodes
    const [mostRecent] = this.undoHistory.slice(-1);
    const merged = mostRecent.merge(nodesById);
    if (Math.abs(merged.size - nodesById.size) > 0) {
      console.debug(
        'addToUndoHistory - user added / removed one or more nodes'
      );
      add();
      return;
    }
    const mostRecentNode = mostRecent
      .filter((node, id) => !node.equals(merged.get(id)))
      .first();
    if (!mostRecentNode) {
      return;
    }
    const updatedNode = nodesById.get(mostRecentNode.get('id'));
    if (updatedNode.get('type') !== mostRecentNode.get('type')) {
      console.debug('addToUndoHistory - one node changed TYPE');
      add();
      return;
    }
    if (!updatedNode.get('meta').equals(mostRecentNode.get('meta'))) {
      console.debug('addToUndoHistory - one node changed META');
      add();
      return;
    }
    if (
      moreThanNCharsAreDifferent(
        updatedNode.get('content'),
        mostRecentNode.get('content'),
        6
      )
    ) {
      console.debug(
        'addToUndoHistory - one node changed more than 2 characters in CONTENT'
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

  diff(current, next) {
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
  }

  init(post) {
    this.post = Immutable.fromJS(post);
    this.nodeUpdates = Map();
  }

  nodeHasBeenStagedForDelete(searchNodeId) {
    return !!this.nodeUpdates.find(
      (update, nodeId) =>
        nodeId === searchNodeId && update.get('action') === NODE_ACTION_DELETE
    );
  }

  undo(current) {
    const mostRecent = this.undoHistory.pop();
    if (mostRecent) {
      this.redoHistory.push(current);
      this.diff(current, mostRecent);
    }
    return mostRecent;
  }

  redo(current) {
    const mostRecent = this.redoHistory.pop();
    if (mostRecent) {
      this.undoHistory.push(current);
      this.diff(current, mostRecent);
    }
    return mostRecent;
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
    console.debug('Batch Debounce');
    clearTimeout(this.commitTimeoutId);
    this.commitTimeoutId = setTimeout(
      () => this.saveContentBatch(documentModel),
      750
    );
  };

  stageNodeDelete(nodeId) {
    if (!nodeId || nodeId === 'null' || nodeId === 'undefined') {
      console.error('stageNodeDelete - trying to update null');
      return;
    }
    if (
      this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE
    ) {
      console.warn('stageNodeDelete - deleting an updated node ', nodeId);
    } else {
      console.info('stageNodeDelete ', nodeId);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') })
    );
  }

  stageNodeUpdate(nodeId) {
    if (!nodeId || nodeId === 'null' || nodeId === 'undefined') {
      console.error('stageNodeUpdate - trying to update null');
      return;
    }
    if (
      this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_DELETE
    ) {
      console.warn('stageNodeUpdate - updating a deleted node ', nodeId);
    } else {
      console.info('stageNodeUpdate ', nodeId);
    }
    this.nodeUpdates = this.nodeUpdates.set(
      nodeId,
      Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id') })
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
