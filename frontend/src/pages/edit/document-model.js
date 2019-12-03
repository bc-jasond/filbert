import Immutable, { isKeyed, List, Map } from 'immutable';

import {
  NEW_POST_URL_ID,
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_CODE,
  NODE_TYPE_CONTENT,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_POSTLINK,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  NODE_TYPE_LI,
  NODE_TYPE_OL,
  NODE_TYPE_PRE,
  ROOT_NODE_PARENT_ID, SELECTION_START, SELECTION_END,
} from '../../common/constants';
import {
  cleanText,
  getMapWithId,
} from '../../common/utils';
import {
  concatSelections, Selection,
} from './selection-helpers';

export function reviver(key, value) {
  if (value.has(SELECTION_START) && value.has(SELECTION_END)) {
    return new Selection(value)
  }
  // ImmutableJS default behavior
  return isKeyed(value) ? value.toMap() : value.toList()
}

export default class DocumentModel {
  post;
  nodesById = Map();
  
  init(post, updateManager = {}, jsonData = null) {
    this.post = Immutable.fromJS(post);
    // TODO: ideally this documentModel class doesn't have to know about the updateManager.
    // But, it's nice to make one call from the consumer (edit.jsx + helpers) that handles the documentModel
    // and the updateManager behind the scenes.  That orchestration would have to move either out into edit.jsx or into another helper class
    this.updateManager = updateManager;
    if (jsonData) {
      this.nodesById = Immutable.fromJS(jsonData, reviver);
      return;
    }
    
    const newTitle = getMapWithId({ type: NODE_TYPE_H1 });
    this.nodesById = Map().set(newTitle.get('id'), newTitle);
  }
  
  getLastNode() {
  
  }
  
  getMapWithId(obj) {
    return getMapWithId(obj).set('post_id', this.post.get('id', NEW_POST_URL_ID));
  }
  
  getNode(nodeId) {
    const node = this.nodesById.get(nodeId);
    if (node) {
      return node;
    }
    console.warn(`getNode id: ${nodeId} - not found!`);
    return Map();
  }
  
  getPrevNode(nodeId) {}
  getNextNode(nodeId) {}
  
  // this will trigger a shouldComponentUpdate -> true for re-rendering
  // this function breaks references inside the nodesById List for all ancestors of an updated node
  setChildren(parentNodeId, children) {
    // replace the updated parent with new children
    this.nodesById = this.nodesById.set(parentNodeId, children);
    if (parentNodeId === ROOT_NODE_PARENT_ID) {
      return this;
    }
    let currentId = parentNodeId;
    // "touch" all ancestors to break references
    while (currentId) {
      const parentId = this.getParent(currentId).get('id') || ROOT_NODE_PARENT_ID;
      const siblings = this.nodesById.get(parentId);
      const currentIdx = siblings.findIndex(n => n.get('id') === currentId);
      // TODO: find a better way to break the reference...
      // HACK: delete & reset "id" to break deep equality (break reference)
      const nodeWithNewReference = this.getNode(currentId)
        .delete('id')
        .set('id', currentId);
      this.nodesById = this.nodesById.set(
        parentId,
        siblings.set(
          currentIdx,
          nodeWithNewReference,
        )
      );
      // TODO: why have the root node in 2 places? once in this.nodesById["null"] and also in this.root
      //  refactor - the "null" parent key is unnecessary
      if (currentId === this.rootId) {
        this.root = nodeWithNewReference;
      }
      currentId = this.getParent(currentId).get('id');
    }
    return this
  }
  
  getSection(nodeId) {
    let sectionId = nodeId;
    while (!this.isSectionType(sectionId)) {
      sectionId = this.getParent(sectionId).get('id');
      if (!sectionId) {
        break;
      }
    }
    return this.getNode(sectionId);
  }
  
  getSibling(nodeId, prev = true) {
    const parent = this.getParent(nodeId);
    if (parent.size === 0) {
      return Map();
    }
    const siblings = this.nodesById.get(parent.get('id'));
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
    if (nodeId === this.rootId) {
      return true;
    }
    const parentId = this.getParent(nodeId).get('id');
    return this.getFirstChild(parentId).get('id') === nodeId;
  }
  
  /**
   * used for setting caret position
   *
   * @param nodeId
   * @returns note: returns a Map() with an 'id' for PRE tags - they won't be in the nodesById list
   */
  getFirstChild(nodeId) {
    const node = this.getNode(nodeId);
    if (node.get('type') === NODE_TYPE_CODE) {
      return Map({
        id: `${nodeId}-0`
      });
    }
    const siblings = this.nodesById.get(nodeId, List());
    if (siblings.size === 0) {
      console.warn('getFirstChild - no children! ', nodeId);
      return Map();
    }
    return siblings.first();
  }
  
  isLastChild(nodeId) {
    if (nodeId === this.rootId) {
      return true;
    }
    const parentId = this.getParent(nodeId).get('id');
    return this.getLastChild(parentId).get('id') === nodeId;
  }
  
  /**
   * @param nodeId
   * @returns note: returns a Map() with an 'id' for PRE tags - they won't be in the nodesById list
   */
  getLastChild(nodeId) {
    const node = this.getNode(nodeId);
    if (node.get('type') === NODE_TYPE_CODE) {
      return Map({
        id: `${nodeId}-${node.getIn(['meta', 'lines'], List()).size - 1}`
      });
    }
    const siblings = this.nodesById.get(nodeId, List());
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
      NODE_TYPE_SPACER,
      NODE_TYPE_CONTENT,
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_POSTLINK,
      NODE_TYPE_QUOTE,
      NODE_TYPE_IMAGE,
      NODE_TYPE_CODE,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  insertSectionAfter(sectionId, type, content = '', meta = Map()) {
    // parent must be root
    const sections = this.nodesById.get(this.rootId, List());
    const siblingIndex = sections.findIndex(s => s.get('id') === sectionId);
    if (siblingIndex === -1) {
      const errorMessage = 'insertSectionAfter - sibling section not found';
      console.error(errorMessage, sectionId);
      throw new Error(errorMessage);
    }
    return this.insertSection(type, siblingIndex + 1, content, meta);
  }
  
  insertSectionBefore(sectionId, type, content = '', meta = Map()) {
    // parent must be root
    const sections = this.nodesById.get(this.rootId, List());
    const siblingIndex = sections.findIndex(s => s.get('id') === sectionId);
    if (siblingIndex === -1) {
      const errorMessage = 'insertSectionBefore - sibling section not found';
      console.error(errorMessage, sectionId);
      throw new Error(errorMessage);
    }
    return this.insert(this.rootId, type, siblingIndex, content, meta);
  }
  
  insertSection(type, index = -1, content = '', meta = Map()) {
    // parent must be root
    return this.insert(this.rootId, type, index, content, meta);
  }
  
  /**
   * this is essentially "splitSectionForInsert"
   */
  splitSection(sectionId, nodeId) {
    const section = this.getNode(sectionId);
    if (!section.get('id') || section.get('type') !== NODE_TYPE_CONTENT) {
      console.error('splitSection - bad section', section);
      throw new Error('splitSection - I only split CONTENT sections ATM')
    }
    const siblings = this.nodesById.get(sectionId);
    const nodeIdx = siblings.findIndex(s => s.get('id') === nodeId);
    if (nodeIdx === -1) {
      console.error('splitSection - bad child', nodeId)
      throw new Error(`splitSection - I can't find "${nodeId}" in section "${sectionId}"`)
    }
    
    // update existing section
    this.setChildren(sectionId, siblings.slice(0, nodeIdx));
    // if all existing nodes moved to the new section, create a new P
    if (this.nodesById.get(sectionId).size === 0) {
      this.insert(sectionId, NODE_TYPE_P, 0);
    }
    this.updateNodesForParent(sectionId);
    // new section
    const newSectionId = this.insertSectionAfter(sectionId, NODE_TYPE_CONTENT);
    this.setChildren(newSectionId, siblings.slice(nodeIdx));
    this.updateNodesForParent(newSectionId);
  }
  
  /**
   * for splitting part of P or LI content into an H1 or H2 section
   *
   * NOTE: this splits a content section but is different from splitSection() in these ways:
   *  1) it takes an index as a split point instead of a node
   *  2) it doesn't add placeholder Ps
   *  3) it deletes the existing section if there aren't any subsections
   *  4) it optionally creates the 2nd section (if there are subsections)
   */
  splitSectionForFormatChange(sectionId, nodeIdx) {
    const section = this.getNode(sectionId);
    if (!section.get('id') || section.get('type') !== NODE_TYPE_CONTENT) {
      console.error('splitSectionForFormatChange - bad section', section);
      throw new Error('splitSectionForFormatChange - I only split CONTENT sections ATM')
    }
    const subSections = this.getChildren(sectionId);
    // NOTE nodeIdx could === subSections.size here because of a delete operation
    if (nodeIdx < 0 || nodeIdx > subSections.size) {
      console.error('splitSectionForFormatChange - index out of bounds', nodeIdx)
      throw new Error(`splitSectionForFormatChange - index out of bounds "${nodeIdx}" in section "${sectionId}"`)
    }
    
    // update existing list
    const leftSubSections = subSections.slice(0, nodeIdx);
    if (leftSubSections.size > 0) {
      this.setChildren(sectionId, leftSubSections);
      this.updateNodesForParent(sectionId);
    }
    
    // new list
    const rightSubSections = subSections.slice(nodeIdx);
    let newSectionId;
    if (rightSubSections.size > 0) {
      newSectionId = this.insertSectionAfter(sectionId, NODE_TYPE_CONTENT);
      this.setChildren(newSectionId, rightSubSections);
      this.updateNodesForParent(newSectionId);
    }
    
    // return offset to insert after or before
    if (leftSubSections.size === 0) {
      this.delete(sectionId);
      return 0;
    }
    return 1;
  }
  
  isParagraphType(nodeId) {
    return [
      NODE_TYPE_P,
      NODE_TYPE_LI,
      NODE_TYPE_H1,
      NODE_TYPE_H2,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  mergeParagraphs(leftId, rightId) {
    if (!(this.isParagraphType(leftId) && this.isParagraphType(rightId))) {
      console.error('mergeParagraphs - can`t do it!', leftId, rightId);
      throw new Error('mergeParagraphs - invalid paragraphs')
    }
    let left = this.getNode(leftId);
    const right = this.getNode(rightId);
    left = left.set('content', `${left.get('content', '')}${right.get('content', '')}`);
    left = concatSelections(left, right);
    this.update(left);
    this.delete(rightId);
  }
  
  mergeSections(left, right) {
    if (!(left.get('type') === NODE_TYPE_CONTENT && right.get('type') === NODE_TYPE_CONTENT)
      && !(left.get('type') === NODE_TYPE_OL && right.get('type') === NODE_TYPE_OL)) {
      console.error('mergeSections', left, right);
      throw new Error('mergeSections - I only merge CONTENT & OL sections ATM')
    }
    const leftSectionId = left.get('id');
    const rightSectionId = right.get('id');
    console.info('mergingSections ', leftSectionId, rightSectionId);
    // left or right could be empty because the selectedNode was already deleted
    const rightNodes = this.nodesById.get(rightSectionId, List());
    const leftNodes = this.nodesById.get(leftSectionId, List());
    this.setChildren(leftSectionId, leftNodes.concat(rightNodes));
    this.updateNodesForParent(leftSectionId);
    this.setChildren(rightSectionId, List());
    this.delete(rightSectionId);
  }
  // TODO: validate subsection / parent type combinations!
  insertSubSectionAfter(siblingId, type, content = '', meta = Map()) {
    const parentId = this.getParent(siblingId).get('id');
    const siblings = this.nodesById.get(parentId, List());
    const siblingIdx = siblings.findIndex(s => s.get('id') === siblingId);
    return this.insert(parentId, type, siblingIdx + 1, content, meta);
  }
  
  insert(parentId, type, index, content, meta) {
    const siblings = this.nodesById.get(parentId, List());
    let newNode = this.getMapWithId({
      type,
      parent_id: parentId,
      position: index,
      content: cleanText(content),
      meta: meta || Map(),
    });
    this.updateManager.stageNodeUpdate(newNode.get('id'));
    this.setChildren(parentId, siblings
      .insert(newNode.get('position'), newNode)
    );
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    // update all nodes
    return newNode.get('id');
  }
  
  update(node) {
    const nodeId = node.get('id');
    this.updateManager.stageNodeUpdate(nodeId);
    this.nodesById = this.nodesById.set(nodeId, node)
    return nodeId
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
    if (this.updateManager.nodeHasBeenStagedForDelete(nodeId)) {
      console.info('edit pipeline - already deleted ', nodeId);
      return;
    }
    // mark this node deleted
    this.updateManager.stageNodeDelete(nodeId);
    const parentId = this.getParent(nodeId).get('id');
    const siblings = this.nodesById.get(parentId, List());
    // filter this node out of its parent list
    this.setChildren(
      parentId,
      siblings.filter(node => node.get('id') !== nodeId)
    );
    // delete this node's children list
    // NOTE: don't stage delete it's children, they might have moved to another section during a merge
    this.nodesById = this.nodesById.delete(nodeId);
    // reindex children and persist changes
    this.updateNodesForParent(parentId);
    // TODO: safe guard against integrity constraint violations, clean up illegal state
    // TODO: add integrity constraints AKA, node type can only have children of type [x,y,z]
  }
  
  // TODO: need a way to focus "terminal" sections like IMAGE, SPACER, QUOTE
  canFocusNode(nodeId) {
    return [
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_P,
      NODE_TYPE_LI,
      NODE_TYPE_PRE,
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
        // TODO: this doesn't handle all cases yet
        focusNodeId = this.canFocusNode(sectionId) ? sectionId : this.getFirstChild(sectionId).get('id');
      } else {
        let prevSectionId = sectionId;
        do {
          prevSectionId = this.getPrevSibling(prevSectionId).get('id');
        } while (prevSectionId && !this.canFocusNode(prevSectionId) && this.getChildren(prevSectionId).size === 0)
        if (this.canFocusNode(prevSectionId)) {
          focusNodeId = prevSectionId;
        } else {
          const lastChild = this.getLastChild(prevSectionId);
          focusNodeId = this.canFocusNode(lastChild.get('id')) ? lastChild.get('id') : this.getLastChild(lastChild.get('id')).get('id')
        }
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
        let nextSectionId = sectionId;
        do {
          nextSectionId = this.getNextSibling(nextSectionId).get('id');
        } while (nextSectionId && !this.canFocusNode(nextSectionId) && this.getChildren(nextSectionId).size === 0)
        if (this.canFocusNode(nextSectionId)) {
          focusNodeId = nextSectionId;
        } else {
          const firstChild = this.getFirstChild(nextSectionId);
          focusNodeId = this.canFocusNode(firstChild.get('id')) ? firstChild.get('id') : this.getFirstChild(firstChild.get('id')).get('id')
        }
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
}