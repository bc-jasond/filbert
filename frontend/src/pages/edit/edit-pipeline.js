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
  ROOT_NODE_PARENT_ID, ZERO_LENGTH_CHAR,
} from '../../common/constants';
import { cleanText, getMapWithId } from '../../common/utils';

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
      this.root = this.nodesByParentId.get(ROOT_NODE_PARENT_ID).first();
      this.rootId = this.root.get('id');
    } else {
      this.root = getMapWithId({ type: NODE_TYPE_ROOT, parent_id: ROOT_NODE_PARENT_ID, position: 0 });
      this.rootId = this.root.get('id');
      this.nodeUpdates = this.nodeUpdates.set(this.rootId, Map({ action: 'update' }));
      this.nodesByParentId = this.nodesByParentId.set(ROOT_NODE_PARENT_ID, List([this.root]));
    }
  }
  
  getMapWithId(obj) {
    return getMapWithId(obj).set('post_id', this.post.get('id', NEW_POST_URL_ID));
  }
  
  getNode(nodeId) {
    if (this.rootId === nodeId) return this.root;
    
    const queue = [this.rootId]
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
    return null;
  }
  
  getParent(nodeId) {
    const node = this.getNode(nodeId);
    if (!node) {
      throw new Error('getParent - parent not found!');
    }
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
    return siblings.get(idx + 1);
  }
  
  nextSectionIsContentType(nodeId) {
    const currentSection = this.getSection(nodeId);
    const nextSection = this.getNextSibling(currentSection.get('id'))
    return nextSection && nextSection.get('type') === NODE_TYPE_SECTION_CONTENT;
  }
  
  getPrevSibling(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    return siblings.get(idx - 1);
  }
  
  isFirstChild(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    return siblings.first().get('id') === nodeId;
  }
  
  isLastChild(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    return siblings.last().get('id') === nodeId;
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
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: 'update', post_id: this.post.get('id') }));
  }
  
  stageNodeDelete(nodeId) {
    this.nodeUpdates = this.nodeUpdates.set(nodeId, Map({ action: 'delete', post_id: this.post.get('id') }));
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
  
  mergeSections(leftSectionId, rightSectionId) {
    const left = this.getNode(leftSectionId);
    const right = this.getNode(rightSectionId);
    if (!(left.get('type') === NODE_TYPE_SECTION_CONTENT && right.get('type') === NODE_TYPE_SECTION_CONTENT)) {
      console.error('mergeSections', left, right);
      throw new Error('mergeSections - I only merge CONTENT sections ATM')
    }
    const rightNodes = this.nodesByParentId.get(rightSectionId);
    this.nodesByParentId = this.nodesByParentId.set(
      leftSectionId,
      this.nodesByParentId.get(leftSectionId)
        .concat(rightNodes)
        .map((n, idx) => n
          .set('parent_id', leftSectionId)
          .set('position', idx)
        )
    );
    this.nodesByParentId.get(leftSectionId).forEach(n => {
      this.stageNodeUpdate(n.get('id'));
    });
    this.nodesByParentId.set(rightSectionId, List());
    this.delete(rightSectionId);
  }
  
  updateSection(node) {}
  
  getText(nodeId) {
    return this.nodesByParentId.get(nodeId).first().get('content');
  }
  
  replaceTextNode(nodeId, contentArg) {
    const content = contentArg || ZERO_LENGTH_CHAR;
    const children = this.nodesByParentId.get(nodeId, List());
    let textNode;
    if (children.size === 0) {
      // add a new text node
      textNode = this.getMapWithId({ type: NODE_TYPE_TEXT, parent_id: nodeId, position: 0, content })
      console.info('replaceTextNode - NEW node: ', textNode)
    } else {
      // update existing text node
      textNode = children.first();
      if (cleanText(textNode.get('content')) === cleanText(contentArg)) {
        // DOM & model already equal, no update needed
        return false;
      }
      console.info('replaceTextNode - existing node: ', textNode)
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
  
  updateSubSection(subSection) {}
  
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
    // mark this node deleted
    this.stageNodeDelete(nodeId);
    const parentId = this.getParent(nodeId).get('id');
    const siblings = this.nodesByParentId.get(parentId);
    // filter this node out of the parent list
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings
      .filter(node => node.get('id') !== nodeId)
    );
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    this.pruneEmptyAndOrphanedParents();
  }
  
  updateNodesForParent(parentId) {
    const siblings = this.nodesByParentId.get(parentId);
    this.nodesByParentId = this.nodesByParentId.set(
      parentId,
      siblings
      // reindex positions for remaining siblings
        .map((node, idx) => node.set('position', idx))
    );
    // since positions have changed, update all nodes for this parent
    // TODO: make this smarter, maybe it's worth it
    this.nodesByParentId.get(parentId).forEach(node => {
      this.stageNodeUpdate(node.get('id'));
    });
  }
  
  getLastChildForCaret(parent) {
    // TODO: only types that are allowed to be focused
    let currentLastId = this.nodesByParentId.get(parent.get('id')).last().get('id');
    while (this.nodesByParentId.get(currentLastId, List()).size > 0) {
      if (this.getNode(currentLastId).get('type') === NODE_TYPE_P) break;
      currentLastId = this.nodesByParentId.get(currentLastId).last().get('id')
    }
    return currentLastId;
  }
  
  pruneEmptyAndOrphanedParents() {
    this.nodesByParentId = this.nodesByParentId.filter(
      (children, id) => {
        if (id === ROOT_NODE_PARENT_ID || (children.size > 0 && this.getNode(id))) {
          return true;
        } else {
          this.stageNodeDelete(id);
          return false;
        }
      }
    );
  }
  
  addPostIdToUpdates(postId) {
    this.nodeUpdates = this.nodeUpdates.map(update => update.set('post_id', postId));
  }
  
  updates() {
    return Object.entries(
      this.nodeUpdates
        .map((update, nodeId) => update.set('node', this.getNode(nodeId)))
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