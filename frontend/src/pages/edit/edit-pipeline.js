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
    if (!nodeId) {
      return Map();
    }
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
    let sectionId = nodeId;
    while (!this.isSectionType(sectionId)) {
      sectionId = this.getParent(sectionId).get('id');
    }
    return this.getNode(sectionId);
  }
  
  getSibling(nodeId, prev = true) {
    const parent = this.getParent(nodeId);
    const siblings = this.nodesByParentId.get(parent.get('id'));
    const idx = siblings.findIndex(s => s.get('id') === nodeId);
    if ((prev && idx === 0) || (!prev && idx === siblings.size - 1)) return Map();
    return siblings.get(prev ? idx - 1 : idx + 1);
  }
  
  getNextSibling(nodeId) {
    return this.getSibling(nodeId, false);
  }
  
  getPrevSibling(nodeId) {
    return this.getSibling(nodeId);
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
  
  nodeHasBeenStagedForUpdate(nodeId) {
    return !!this.nodeUpdates.find((update, nodeId) => nodeId === searchNodeId && update.get('action') === NODE_ACTION_UPDATE)
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
        .filterNot( (update, nodeId) => nodeId === 'null' || !nodeId)
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
    // left or right could be empty because the selectedNode was already deleted
    const rightNodes = this.nodesByParentId.get(rightSectionId, List());
    const leftNodes = this.nodesByParentId.get(leftSectionId, List());
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
      console.error('edit pipeline - delete - trying to delete the root node!')
      return;
    }
    // check if node is already deleted
    if (this.nodeHasBeenStagedForDelete(nodeId)) {
      console.info('edit pipeline - already deleted ', nodeId);
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
    // note: don't stage delete it's children, they might have moved to another section during a merge
    this.nodesByParentId = this.nodesByParentId.delete(nodeId);
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    // safe guard against integrity constraint violations
    // TODO: add integrity constraints AKA, node type can only have children of type [x,y,z]
    // this.pruneEmptyAndOrphanedParents();
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
  
  canFocusNode(nodeId) {
    return [
      NODE_TYPE_SECTION_H1,
      NODE_TYPE_SECTION_H2,
      NODE_TYPE_P,
    ].includes(this.getNode(nodeId).get('type'));
  }
  
  getPreviousFocusNodeId(nodeId) {
    let focusNodeId;
    if (nodeId === this.rootId || this.isSectionType(nodeId)) {
      let sectionId = nodeId;
      if (nodeId === this.rootId) {
        // nodeId is ROOT - get first section
        console.info('getPreviousFocusNodeId for ROOT ', nodeId);
        sectionId = this.getFirstChild(nodeId).get('id');
      }
      // nodeId is a Section
      // TODO: some 'sections' are actually 'subsections' that can be focused - this design is probably a bad idea
      console.info('getPreviousFocusNodeId for SECTION', sectionId);
      if (this.isFirstChild(sectionId) || this.isOnlyChild(sectionId)) {
        focusNodeId = this.canFocusNode(sectionId) ? sectionId : this.getFirstChild(sectionId).get('id');
      } else {
        const prevSectionId = this.getPrevSibling(sectionId).get('id');
        focusNodeId = this.canFocusNode(prevSectionId) ? prevSectionId : this.getLastChild(prevSectionId).get('id');
      }
    } else {
      // nodeId is a P or bad things
      console.info('getPreviousFocusNodeId for P', nodeId);
      if (this.isOnlyChild(nodeId) || this.isFirstChild(nodeId)) {
        focusNodeId = nodeId;
      } else {
        focusNodeId = this.getPrevSibling(nodeId).get('id');
      }
    }
    if (!focusNodeId) {
      console.error(`getPreviousFocusNodeId - can't find a node before `, nodeId, ' type ', this.getNode(nodeId).get('type'));
    }
    console.info('getPreviousFocusNodeId found: ', focusNodeId);
    return focusNodeId;
  }
  
  getNextFocusNodeId(nodeId) {
    let focusNodeId;
    if (nodeId === this.rootId || this.isSectionType(nodeId)) {
      let sectionId = nodeId;
      if (nodeId === this.rootId) {
        // nodeId is ROOT
        console.info('getNextFocusNodeId for ROOT ', nodeId);
        sectionId = this.getLastChild(nodeId).get('id');
      }
      // nodeId is a Section
      // TODO: some 'sections' are actually 'subsections' that can be focused - this design is probably a bad idea
      console.info('getNextFocusNodeId for SECTION', sectionId);
      if (this.isLastChild(sectionId) || this.isOnlyChild(sectionId)) {
        focusNodeId = this.canFocusNode(sectionId) ? sectionId : this.getLastChild(sectionId).get('id');
      } else {
        const nextSectionId = this.getNextSibling(sectionId).get('id');
        focusNodeId = this.canFocusNode(nextSectionId) ? nextSectionId : this.getFirstChild(nextSectionId).get('id');
      }
    } else {
      // nodeId is a P
      console.info('getNextFocusNodeId for P', nodeId);
      if (this.isOnlyChild(nodeId) || this.isLastChild(nodeId)) {
        focusNodeId = nodeId;
      } else {
        focusNodeId = this.getNextSibling(nodeId).get('id');
      }
    }
    if (!focusNodeId) {
      console.error(`getNextFocusNodeId - can't find a node after: `, nodeId, ', type: ', this.getNode(nodeId).get('type'));
    }
    console.info('getNextFocusNodeId found: ', focusNodeId, ', type: ', this.getNode(focusNodeId).get('type'));
    return focusNodeId;
  }
  
  // TODO: this is a bad idea but, if the DOM gets into an illegal state everything is F!@KED
  pruneEmptyAndOrphanedParents() {
    console.warn('pruneEmptyAndOrphanedParents BAD BAD BAD!');
    return;
    
    const idsToDelete = this.nodesByParentId
      .filterNot(
        (children, id) => (id === ROOT_NODE_PARENT_ID || (children.size > 0 && this.getNode(id).get('id')))
      )
      .map((_, id) => id);
    
    if (idsToDelete.size > 0) {
      console.info('pruneEmptyAndOrphanedParents ', idsToDelete);
    }
    idsToDelete.forEach(id => {
      // this.delete(id);
    });
  }
}