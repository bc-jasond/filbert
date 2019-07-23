import Immutable, { Map } from 'immutable';

import {
  NODE_ACTION_UPDATE,
  NODE_ACTION_DELETE,
} from '../../common/constants';

export default class EditUpdateManager {
  post;
  nodeUpdates;
  
  init(post) {
    this.post = Immutable.fromJS(post);
    this.nodeUpdates = Map();
  }
  
  stageNodeUpdate(nodeId) {
    if (nodeId === null || nodeId === 'null') {
      console.error('stageNodeUpdate - trying to update null');
      return;
    }
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_DELETE) {
      console.warn('stageNodeUpdate - updating a deleted node');
    }
    console.info('stageNodeUpdate ', nodeId);
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id') }));
  }
  
  stageNodeDelete(nodeId) {
    if (nodeId === null || nodeId === 'null') {
      console.error('stageNodeDelete - trying to update null');
      return;
    }
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE) {
      console.warn('stageNodeDelete - deleting an updated node');
    }
    console.info('stageNodeDelete ', nodeId);
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') }));
  }
  
  nodeHasBeenStagedForDelete(searchNodeId) {
    return !!this.nodeUpdates.find((update, nodeId) => nodeId === searchNodeId && update.get('action') === NODE_ACTION_DELETE)
  }
  
  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update => update.set('post_id', postId));
  }
  
  updates(documentModel) {
    return Object.entries(
      this.nodeUpdates
      // don't send bad updates
        .filterNot( (update, nodeId) => nodeId === 'null' || !nodeId || (update.get('action') === NODE_ACTION_UPDATE && documentModel.getNode(nodeId).size === 0))
        // don't look for deleted nodes...
        .map((update, nodeId) => update.get('action') === NODE_ACTION_DELETE ? update : update.set('node', documentModel.getNode(nodeId)))
        .toJS()
    );
  }
  
  clearUpdates() {
    if (this.nodeUpdates.size > 0) {
      console.info('clearUpdates - clearing non-empty update pipeline', this.nodeUpdates);
    }
    this.nodeUpdates = Map();
  }
}
