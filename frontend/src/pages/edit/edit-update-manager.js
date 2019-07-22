import Immutable, { List, Map } from 'immutable';

import {
  NEW_POST_URL_ID,
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
  NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_POSTLINK,
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER,
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_PRE,
  ROOT_NODE_PARENT_ID,
  NODE_ACTION_UPDATE,
  NODE_ACTION_DELETE,
} from '../../common/constants';
import {
  cleanText,
  getMapWithId,
} from '../../common/utils';

export default class EditUpdateManager {
  post;
  root;
  rootId;
  infiniteLoopCount = 0;
  nodesByParentId = Map();
  nodeUpdates = Map(); // keyed off of nodeId to avoid duplication TODO: add a debounced save timer per element
  
  init(post, documentModel) {
    this.post = Immutable.fromJS(post);
    this.documentModel = documentModel;
    if (jsonData) {
      this.nodesByParentId = Immutable.fromJS(jsonData);
      this.root = this.getFirstChild(ROOT_NODE_PARENT_ID);
      this.rootId = this.root.get('id');
    } else {
      this.root = getMapWithId({ type: NODE_TYPE_ROOT, parent_id: ROOT_NODE_PARENT_ID, position: 0 });
      this.rootId = this.root.get('id');
      this.nodeUpdates = this.nodeUpdates.set(this.rootId, Map({ action: NODE_ACTION_UPDATE }));
      this.nodesByParentId = this.nodesByParentId.set(ROOT_NODE_PARENT_ID, List([this.root]));
    }
  }
  
  getMapWithId(obj) {
    return getMapWithId(obj).set('post_id', this.post.get('id', NEW_POST_URL_ID));
  }
  
  getNode(nodeId) {
    this.infiniteLoopCount = 0;
    if (this.rootId === nodeId) return this.root;
    
    const queue = [this.rootId];
    while (queue.length) {
      if (this.infiniteLoopCount++ > 1000) {
        throw new Error('getNode is Out of Control!!!');
      }
      const currentList = this.nodesByParentId.get(queue.shift(), List());
      const node = currentList.find(node => node.get('id') === nodeId);
      if (node) {
        return node;
      }
      currentList.forEach(n => {
        queue.push(n.get('id'));
      })
    }
    console.warn(`getNode id: ${nodeId} - not found!`);
    return Map();
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
  
  updates() {
    return Object.entries(
      this.nodeUpdates
      // don't send bad updates
        .filterNot( (update, nodeId) => nodeId === 'null' || !nodeId || (update.get('action') === NODE_ACTION_UPDATE && this.getNode(nodeId).size === 0))
        // don't look for deleted nodes...
        .map((update, nodeId) => update.get('action') === NODE_ACTION_DELETE ? update : update.set('node', this.getNode(nodeId)))
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