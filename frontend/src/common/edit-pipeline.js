import Immutable, { List, Map } from 'immutable';
import {
  NODE_TYPE_P, NODE_TYPE_SECTION_CODE,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1, NODE_TYPE_SECTION_H2, NODE_TYPE_SECTION_IMAGE,
  NODE_TYPE_SECTION_POSTLINK, NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_SPACER, NODE_TYPE_TEXT
} from './constants';
import { getMapWithId } from './utils';

export default class EditPipeline {
  post;
  root;
  rootId;
  nodesByParentId = Map();
  nodeUpdates = {}; // keyed off of nodeId to avoid duplication TODO: add a debounced save timer per element
  
  init(post, jsonData) {
    this.post = Immutable.fromJS(post);
    this.nodesByParentId = Immutable.fromJS(jsonData);
    this.root = this.nodesByParentId.get('null').first();
    this.rootId = this.root.get('id');
  }
  
  getMapWithId(obj) {
    return getMapWithId(obj).set('post_id', this.post.get('id'));
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
  
  getNextSibling(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    return siblings.get(idx + 1);
  }
  
  getPrevSibling(nodeId) {}
  
  isFirstChild(nodeId) {}
  
  isLastChild(nodeId) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    return idx === (siblings.size - 1);
  }
  
  isSectionType(node) {
    return [
      NODE_TYPE_SECTION_SPACER,
      NODE_TYPE_SECTION_CONTENT,
      NODE_TYPE_SECTION_H1,
      NODE_TYPE_SECTION_H2,
      NODE_TYPE_SECTION_POSTLINK,
      NODE_TYPE_SECTION_QUOTE,
      NODE_TYPE_SECTION_IMAGE,
      NODE_TYPE_SECTION_CODE,
    ].includes(node.get('type'))
  }
  
  canHaveChildren(nodeId) {}
  
  updateFromDom(nodeId, content) {
    const children = this.nodesByParentId.get(nodeId, List());
    let textNode;
    console.info('updateFromDom nodeId, children', nodeId, children);
    if (children.size === 0) {
      // add a new text node
      textNode = this.getMapWithId({ type: NODE_TYPE_TEXT, parent_id: nodeId, position: 0, content })
    } else {
      // update existing text node
      textNode = children.first();
      console.info('updateFromDom existing node', textNode)
      textNode = textNode.set('content', content);
    }
    this.nodeUpdates[textNode.get('id')] = { action: 'update', node: textNode };
    this.nodesByParentId = this.nodesByParentId.set(nodeId, List([textNode]));
  }
  
  insertSectionAfter(sectionId, type) {
    // parent must be root
    const sections = this.nodesByParentId.get(this.rootId);
    const siblingIndex = sections.findIndex(s => s.get('id') === sectionId);
    if (siblingIndex === -1) {
      const errorMessage = 'insertSectionAfter - sibling section not found';
      console.error(errorMessage, sectionId);
      throw new Error(errorMessage);
    }
    return this.insertSection(type, siblingIndex + 1);
  }
  
  insertSection(type, index = -1) {
    // parent must be root
    const sections = this.nodesByParentId.get(this.rootId);
    let newSection = this.getMapWithId({
      type,
      parent_id: this.rootId,
      position: (index === -1 ? sections.size : index)
    })
    this.nodeUpdates[newSection.get('id')] = { action: 'update', node: newSection };
    this.nodesByParentId = this.nodesByParentId.set(this.rootId, sections.insert(newSection.get('position'), newSection));
    return newSection.get('id');
  }
  
  updateSection(node) {}
  
  insertSubSectionAfter(siblingId, type) {
    const parentId = this.getParent(siblingId).get('id');
    const siblings = this.nodesByParentId.get(parentId);
    const siblingIdx = siblings.findIndex(s => s.get('id') === siblingId);
    let newSubSection = this.getMapWithId({
      type,
      parent_id: parentId,
      position: siblingIdx + 1,
    })
    this.nodeUpdates[newSubSection.get('id')] = { action: 'update', node: newSubSection };
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings.insert(newSubSection.get('position'), newSubSection));
    return newSubSection.get('id');
  }
  
  insertSubSection(parentId, type, index) {
    const siblings = this.nodesByParentId.get(parentId);
    let newSubSection = this.getMapWithId({
      type,
      parent_id: parentId,
      position: index,
    })
    this.nodeUpdates[newSubSection.get('id')] = { action: 'update', node: newSubSection };
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings.insert(newSubSection.get('position'), newSubSection));
    return newSubSection.get('id');
  }
  
  updateSubSection(subSection) {}
  
  /**
   * delete a node and all of it's children
   */
  delete(nodeId) {
    // mark this node deleted
    this.nodeUpdates[nodeId] = { action: 'delete', node: this.getNode(nodeId) };
    const parentId = this.getParent(nodeId).get('id');
    const siblings = this.nodesByParentId.get(parentId);
    // filter this node out of the parent list
    this.nodesByParentId = this.nodesByParentId.set(parentId, siblings
      .filter(node => node.get('id') !== nodeId)
      // reindex positions for remaining siblings
      .map((node, idx) => node.set('position', idx))
    );
    
    let children = this.nodesByParentId.get(nodeId, List());
    const queue = [...children.map(c => c.get('id')).toJS()];
    while (queue.length) {
      const currentId = queue.shift();
      this.delete(currentId);
    }
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
  
  pruneEmptyParents() {
    this.nodesByParentId = this.nodesByParentId.filter(children => children.size > 0);
  }
  
  updates() {
    return Object.values(this.nodeUpdates);
  }
  
  clearUpdates() {
    if (Object.values(this.nodeUpdates).length > 0) {
      console.warn('Edit Pipeline - clearing non-empty update pipeline', this.nodeUpdates);
    }
    this.nodeUpdates = {};
  }
}