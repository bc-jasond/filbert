import Immutable, { Map } from 'immutable';

import { NODE_ACTION_DELETE, NODE_ACTION_UPDATE } from '../../common/constants';

export default class UpdateManager {
  post;

  nodeUpdates;

  init(post) {
    this.post = Immutable.fromJS(post);
    this.nodeUpdates = Map();
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

  nodeHasBeenStagedForDelete(searchNodeId) {
    return !!this.nodeUpdates.find(
      (update, nodeId) =>
        nodeId === searchNodeId && update.get('action') === NODE_ACTION_DELETE
    );
  }

  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update =>
      update.set('post_id', postId)
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

  clearUpdates() {
    if (this.nodeUpdates.size > 0) {
      console.info(
        'clearUpdates - clearing non-empty update pipeline',
        this.nodeUpdates
      );
    }
    this.nodeUpdates = Map();
  }
}
