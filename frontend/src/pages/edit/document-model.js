import Immutable, { isKeyed, List, Map } from 'immutable';
import pre from '../../common/components/pre';

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
  updateManager;
  nodesById = Map();
  
  static getFirstNode(nodesById) {
    const idSeen = new Set();
    const nextSeen = new Set();
    nodesById.forEach(node => {
      idSeen.add(node.get('id'));
      if (node.get('next_sibling_id')) {
        nextSeen.add(node.get('next_sibling_id'));
      }
    })
    const difference = new Set([...idSeen].filter(id => !nextSeen.has(id)))
    if (difference.size !== 1) {
      console.error("DocumentError.getFirstNode() - more than one node isn't pointed to by another node!", difference)
    }
    const [firstId] = [...difference];
    return nodesById.get(firstId);
  }
  
  static getLastNode(nodesById) {
    return nodesById
      .filter(n => !n.get('next_sibling_id'))
      .first(Map());
  }
  
  init(post, updateManager = {}, jsonData = null) {
    this.post = Immutable.fromJS(post);
    // TODO: ideally this documentModel class doesn't have to know about the updateManager.
    // But, it's nice to make one call from the consumer (edit.jsx + helpers) that handles the documentModel
    // and the updateManager behind the scenes.  That orchestration would have to move either out into edit.jsx or into another helper class
    this.updateManager = updateManager;
    if (jsonData) {
      this.nodesById = Immutable.fromJS(jsonData, reviver);
      return DocumentModel.getLastNode(this.nodesById).get('id');
    }
    return this.clearNodesAndSetTitlePlaceholder();
  }
  
  clearNodesAndSetTitlePlaceholder() {
    const newTitle = getMapWithId({ type: NODE_TYPE_H1 });
    this.nodesById = Map().set(newTitle.get('id'), newTitle);
    return newTitle.get('id');
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
  
  getPrevNode(nodeId) {
    return this.nodesById
      .filter(n => n.get('next_sibling_id') === nodeId)
      .first(Map())
  }
  getNextNode(nodeId) {
    return this.getNode(this.getNode(nodeId).get('next_sibling_id'));
  }
  
  isFirstOfType(nodeId, type) {
    return this.getPrevNode(nodeId).get('type') !== type;
  }
  
  isLastOfType(nodeId) {
    const type = this.getNode(nodeId).get('type');
    return this.getNextNode(nodeId).get('type') !== type;
  }
  
  isTextType(nodeId) {
    return [
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_PRE,
      NODE_TYPE_P,
      NODE_TYPE_LI,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  canHaveSelections(nodeId) {
    return [
      NODE_TYPE_P,
      NODE_TYPE_LI,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  isMetaType(nodeId) {
    return [
      NODE_TYPE_SPACER,
      NODE_TYPE_POSTLINK,
      NODE_TYPE_QUOTE,
      NODE_TYPE_IMAGE,
    ].includes(this.getNode(nodeId).get('type'))
  }
  
  mergeParagraphs(leftId, rightId) {
    if (!(this.isTextType(leftId) && this.isTextType(rightId))) {
      console.error('mergeParagraphs - can`t do it!', leftId, rightId);
      throw new Error('mergeParagraphs - invalid paragraphs')
    }
    let left = this.getNode(leftId);
    const right = this.getNode(rightId);
    left = left.set('content', `${left.get('content', '')}${right.get('content', '')}`);
    if (this.canHaveSelections(leftId)) {
      left = concatSelections(left, right);
    }
    this.update(left);
    this.delete(rightId);
  }
  
  insert(type, neighborNodeId, content = '', meta = Map(), shouldInsertAfter = true) {
    let neighbor = this.getNode(neighborNodeId);
    if (!neighbor.get('id')) {
      throw new Error(`DocumentModel.insert() - bad neighbor id! ${neighborNodeId}`)
    }
    let newNode = this.getMapWithId({
      type,
      content: cleanText(content),
      meta,
    });
    if (shouldInsertAfter) {
      const oldNeighborNext = this.getNextNode(neighborNodeId);
      this.update(!oldNeighborNext.get('id')
        ? newNode
        : newNode.set('next_sibling_id', oldNeighborNext.get('id')))
      this.update(neighbor.set('next_sibling_id', newNode.get('id')))
    }
    // insert before
    else {
      const oldNeighborPrev = this.getPrevNode(neighborNodeId);
      if (oldNeighborPrev.get('id')) {
        this.update(oldNeighborPrev.set('next_sibling_id', newNode.get('id')))
      }
      this.update(newNode.set('next_sibling_id', neighborNodeId))
    }
    return newNode.get('id');
  }
  
  update(node) {
    const nodeId = node.get('id');
    this.updateManager.stageNodeUpdate(nodeId);
    this.nodesById = this.nodesById.set(nodeId, node)
    return nodeId
  }
  
  delete(nodeId) {
    // mark this node deleted
    this.updateManager.stageNodeDelete(nodeId);
    const prevNode = this.getPrevNode(nodeId);
    const nextNode = this.getNextNode(nodeId);
    // delete first, then update pointers
    this.nodesById = this.nodesById.delete(nodeId);
    // deleting the only node in the document
    if (!prevNode.get('id') && !nextNode.get('id')) {
      this.clearNodesAndSetTitlePlaceholder()
    }
    // deleting somewhere in the middle
    else if (prevNode.get('id') && nextNode.get('id')) {
      this.update(prevNode.set('next_sibling_id', nextNode.get('id')))
    }
    // deleting last node - unset "next" reference
    else if (!nextNode.get('id')) {
      this.update(prevNode.delete('next_sibling_id'))
    }
    // else - deleting first node - noop
  }
  
  // TODO: need a way to focus "terminal" sections like IMAGE, SPACER, QUOTE
}