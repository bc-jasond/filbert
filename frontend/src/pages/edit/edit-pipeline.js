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
  NODE_TYPE_TEXT,
  ROOT_NODE_PARENT_ID,
  NODE_ACTION_UPDATE,
  NODE_ACTION_DELETE,
} from '../../common/constants';
import {
  cleanText,
  cleanTextOrZeroLengthPlaceholder,
  getMapWithId,
} from '../../common/utils';

export default class EditPipeline {
  post;
  root;
  rootId;
  nodesByParentId = Map();
  nodeUpdates = Map(); // keyed off of nodeId to avoid duplication TODO: add a debounced save timer per element
  
  init(post, jsonData = null) {
    this.post = Immutable.fromJS(post);
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
    if (this.rootId === nodeId) return this.root;
    
    const queue = [this.rootId];
    while (queue.length) {
      const currentList = this.nodesByParentId.get(queue.shift(), List());
      const node = currentList.find(node => node.get('id') === nodeId);
      if (node) {
        return node;
      }
      currentList.forEach(n => {
        queue.push(n.get('id'));
      })
    }
    console.error(`getNode id: ${nodeId} - not found!`);
    return Map();
  }
  
  getParent(nodeId) {
    const node = this.getNode(nodeId);
    return this.getNode(node.get('parent_id'));
  }
  
  getSection(nodeId) {
    let sectionId = this.getNode(nodeId).get('id');
    while (!this.isSectionType(sectionId)) {
      sectionId = this.getParent(sectionId).get('id');
    }
    return this.getNode(sectionId);
  }
  
  getNextSibling(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    if (idx === siblings.size - 1) {
      return Map();
    }
    return siblings.get(idx + 1);
  }
  
  nextSectionIsContentType(nodeId) {
    const currentSection = this.getSection(nodeId);
    const nextSection = this.getNextSibling(currentSection.get('id'))
    return nextSection.get('type') === NODE_TYPE_SECTION_CONTENT;
  }
  
  getPrevSibling(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    if (idx === 0) return Map();
    return siblings.get(idx - 1);
  }
  
  isFirstChild(nodeId) {
    const parentId = this.getParent(nodeId).get('id');
    return this.getFirstChild(parentId).get('id') === nodeId;
  }
  
  getFirstChild(nodeId) {
    const siblings = this.nodesByParentId.get(nodeId, List());
    if (siblings.size === 0) {
      console.warn('getFirstChild - no children! ', nodeId);
      return Map();
    }
    return siblings.first();
  }
  
  isLastChild(nodeId) {
    const parentId = this.getParent(nodeId).get('id');
    return this.getLastChild(parentId).get('id') === nodeId;
  }
  
  getLastChild(nodeId) {
    const siblings = this.nodesByParentId.get(nodeId, List());
    if (siblings.size === 0) {
      console.warn('getLastChild - no children! ', nodeId);
      return Map();
    }
    return siblings.last();
  }
  
  isOnlyChild(nodeId) {
    return this.isFirstChild(nodeId) && this.isLastChild(nodeId);
  }
  
  isSectionType(nodeId) {
    return [
      NODE_TYPE_SECTION_SPACER,
      NODE_TYPE_SECTION_CONTENT,
      NODE_TYPE_SECTION_H1,
      NODE_TYPE_SECTION_H2,
      NODE_TYPE_SECTION_POSTLINK,
      NODE_TYPE_SECTION_QUOTE,
      NODE_TYPE_SECTION_IMAGE,
      NODE_TYPE_SECTION_CODE,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  canHaveChildren(nodeId) {}
  
  stageNodeUpdate(nodeId) {
    if (nodeId === null || nodeId === 'null') {
      console.warn('stageNodeUpdate - trying to update null');
      return;
    }
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_DELETE) {
      console.warn('stageNodeUpdate - updating a deleted node, pain could be nigh');
    }
    console.info('stageNodeUpdate ', nodeId);
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: NODE_ACTION_UPDATE, post_id: this.post.get('id') }));
  }
  
  stageNodeDelete(nodeId) {
    if (nodeId === null || nodeId === 'null') {
      console.warn('stageNodeDelete - trying to update null');
      return;
    }
    if (this.nodeUpdates.get(nodeId, Map()).get('action') === NODE_ACTION_UPDATE) {
      console.warn('stageNodeDelete - deleting an updated node, pain could be nigh');
    }
    console.info('stageNodeDelete ', nodeId);
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: NODE_ACTION_DELETE, post_id: this.post.get('id') }));
  }
  
  insertSectionAfter(sectionId, type) {
    // parent must be root
    const sections = this.nodesByParentId.get(this.rootId, List());
    const siblingIndex = sections.findIndex(s => s.get('id') === sectionId);
    if (siblingIndex === -1) {
      const errorMessage = 'insertSectionAfter - sibling section not found';
      console.error(errorMessage, sectionId);
      throw new Error(errorMessage);
    }
    return this.insert(this.rootId, type, siblingIndex + 1);
  }
  
  insertSection(type, index = -1) {
    // parent must be root
    return this.insert(this.rootId, type, index);
  }
  
  splitSection(sectionId, nodeId) {
    const section = this.getNode(sectionId);
    if (section.get('type') !== NODE_TYPE_SECTION_CONTENT) {
      console.error('splitSection', section);
      throw new Error('splitSection - I only split CONTENT sections ATM')
    }
    const siblings = this.nodesByParentId.get(sectionId);
    const nodeIdx = siblings.findIndex(s => s.get('id') === nodeId);
    
    this.delete(nodeId);
    // update existing section
    this.nodesByParentId = this.nodesByParentId.set(sectionId, siblings.slice(0, nodeIdx));
    // if all existing nodes moved to the new section, create a new P
    if (this.nodesByParentId.get(sectionId).size === 0) {
      this.insert(sectionId, NODE_TYPE_P, 0);
    }
    this.updateNodesForParent(sectionId);
    // new section
    const newSectionid = this.insertSectionAfter(sectionId, NODE_TYPE_SECTION_CONTENT);
    this.nodesByParentId = this.nodesByParentId.set(newSectionid, siblings.slice(nodeIdx));
    // if all existing nodes stayed in the existing section, create a new P
    if (this.nodesByParentId.get(newSectionid).size === 0) {
      this.insert(newSectionid, NODE_TYPE_P, 0);
    }
    this.updateNodesForParent(newSectionid);
  }
  
  mergeSections(leftSectionId, rightSectionId) {
    const left = this.getNode(leftSectionId);
    const right = this.getNode(rightSectionId);
    if (!(left.get('type') === NODE_TYPE_SECTION_CONTENT && right.get('type') === NODE_TYPE_SECTION_CONTENT)) {
      console.error('mergeSections', left, right);
      throw new Error('mergeSections - I only merge CONTENT sections ATM')
    }
    console.info('mergingSections ', left.get('id'), right.get('id'));
    const rightNodes = this.nodesByParentId.get(rightSectionId);
    const leftNodes = this.nodesByParentId.get(leftSectionId);
    this.nodesByParentId = this.nodesByParentId.set(leftSectionId, leftNodes.concat(rightNodes));
    this.updateNodesForParent(leftSectionId);
    this.nodesByParentId = this.nodesByParentId.set(rightSectionId, List());
    this.delete(rightSectionId);
  }
  
  getText(nodeId) {
    return cleanText(this.getFirstChild(nodeId).get('content', ''));
  }
  
  replaceTextNode(nodeId, contentArg) {
    const content = cleanTextOrZeroLengthPlaceholder(contentArg);
    let textNode = this.getFirstChild(nodeId);
    if (!textNode.get('id')) {
      // add a new text node
      textNode = this.getMapWithId({ type: NODE_TYPE_TEXT, parent_id: nodeId, position: 0, content })
      console.info('replaceTextNode - NEW node: ', textNode)
    } else {
      if (textNode.get('type') !== NODE_TYPE_TEXT) {
        console.warn('replaceTextNode - comparing other node type: ', textNode.toJS());
        return false;
      }
      if (cleanTextOrZeroLengthPlaceholder(textNode.get('content')) === content) {
        // DOM & model already equal, no update needed
        return false;
      }
      console.info('replaceTextNode - existing node: ', textNode);
      textNode = textNode.set('content', content);
    }
    this.stageNodeUpdate(textNode.get('id'));
    this.nodesByParentId = this.nodesByParentId.set(nodeId, List([textNode]));
    return true;
  }
  
  insertSubSectionAfter(siblingId, type) {
    const parentId = this.getParent(siblingId).get('id');
    const siblings = this.nodesByParentId.get(parentId, List());
    const siblingIdx = siblings.findIndex(s => s.get('id') === siblingId);
    return this.insert(parentId, type, siblingIdx + 1);
  }
  
  insert(parentId, type, index) {
    const siblings = this.nodesByParentId.get(parentId, List());
    let newNode = this.getMapWithId({
      type,
      parent_id: parentId,
      position: index,
    });
    this.stageNodeUpdate(newNode.get('id'));
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings
      .insert(newNode.get('position'), newNode)
    );
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    // update all nodes
    return newNode.get('id');
  }
  
  /**
   * delete a node and all of it's children
   */
  delete(nodeId) {
    if (nodeId === this.rootId) {
      console.warn('edit pipeline - delete - trying to delete the root node!')
      return;
    }
    // mark this node deleted
    this.stageNodeDelete(nodeId);
    const parentId = this.getParent(nodeId).get('id');
    const siblings = this.nodesByParentId.get(parentId);
    // filter this node out of its parent list
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings
      .filter(node => node.get('id') !== nodeId)
    );
    // delete this node's children list
    this.nodesByParentId = this.nodesByParentId.delete(nodeId);
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    // safe guard against integrity constraint violations
    // TODO: add integrity constraints AKA, node type can only have children of type [x,y,z]
    this.pruneEmptyAndOrphanedParents();
  }
  
  updateNodesForParent(parentId) {
    console.info('updateNodesForParent ', parentId);
    const siblings = this.nodesByParentId.get(parentId, List());
    this.nodesByParentId = this.nodesByParentId.set(
      parentId,
      siblings
      // reindex positions for remaining siblings
        .map((node, idx) => node
          .set('position', idx)
          .set('parent_id', parentId))
    );
    // since positions have changed, update all nodes for this parent
    // TODO: make this smarter, maybe it's worth it
    this.nodesByParentId.get(parentId, List()).forEach(node => {
      this.stageNodeUpdate(node.get('id'));
    });
  }
  
  getClosestFocusNodeInSection(sectionId, isPrevious = true) {
    console.info('getClosestFocusNodeId for SECTION', sectionId);
    if ((isPrevious && this.isFirstChild(sectionId)) || (!isPrevious && this.isLastChild(sectionId)) || this.isOnlyChild(sectionId)) {
      return isPrevious ? this.getFirstChild(sectionId).get('id') : this.getLastChild(sectionId).get('id');
    }
    if (isPrevious) {
      const prevSectionId = this.getPrevSibling(sectionId).get('id');
      return this.getLastChild(prevSectionId).get('id');
    } else {
      const nextSectionId = this.getNextSibling(sectionId).get('id');
      return this.getFirstChild(nextSectionId).get('id');
    }
  }
  
  getClosestFocusNodeId(nodeId, isPrevious = true) {
    let focusNodeId;
    if (nodeId === this.rootId) {
      // nodeId is ROOT
      console.info('getClosestFocusNodeId for ROOT ', nodeId);
      const sectionId = isPrevious
        ? this.getFirstChild(nodeId).get('id')
        : this.getLastChild(nodeId).get('id');
      focusNodeId = this.getClosestFocusNodeInSection(sectionId, isPrevious)
    } else if (this.isSectionType(nodeId)) {
      // nodeId is a Section
      focusNodeId = this.getClosestFocusNodeInSection(nodeId, isPrevious);
    } else {
      // nodeId is a P
      console.info('getClosestFocusNodeId for P', nodeId);
      const currentSectionId = this.getSection(nodeId).get('id');
      if (this.isOnlyChild(nodeId)
        || (isPrevious && this.isFirstChild(nodeId))
        || (!isPrevious && this.isLastChild(nodeId))) {
        focusNodeId = nodeId;
      } else if (isPrevious && !this.isFirstChild(nodeId)) {
        focusNodeId = this.getPrevSibling(nodeId).get('id');
      } else if (!isPrevious && !this.isLastChild()) {
        focusNodeId = this.getNextSibling(nodeId).get('id');
      }
    }
    
    if (!focusNodeId) {
      console.error(`WTF? getClosestFocusNodeId - I can't find another node ${isPrevious ? 'in front of' : 'after'} ${nodeId}`);
    }
  
    console.info('getClosestFocusNodeId found: ', focusNodeId);
    
    return focusNodeId;
  }
  
  pruneEmptyAndOrphanedParents() {
    this.nodesByParentId = this.nodesByParentId.filter(
      (children, id) => {
        if (id === ROOT_NODE_PARENT_ID || (children.size > 0 && this.getNode(id).get('id'))) {
          return true;
        } else {
          this.stageNodeDelete(id);
          return false;
        }
      });
  }
  
  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update => update.set('post_id', postId));
  }
  
  updates() {
    return Object.entries(
      this.nodeUpdates
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