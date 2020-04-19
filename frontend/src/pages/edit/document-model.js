import Immutable, { Map } from 'immutable';

import {
  NEW_POST_URL_ID,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_LI,
  NODE_TYPE_P,
  NODE_TYPE_PRE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
} from '../../common/constants';
import { cleanText, getMapWithId, reviver } from '../../common/utils';
import { concatSelections } from './selection-helpers';

export default (postArg, updateManager = {}, jsonData = null) => {
  let nodesById;

  const post = Immutable.fromJS(postArg);
  // TODO: ideally this documentModel class doesn't have to know about the updateManager.
  // But, it's nice to make one call from the consumer (edit.jsx + helpers) that handles the documentModel
  // and the updateManager behind the scenes.  That orchestration would have to move either out into edit.jsx or into another helper class

  if (jsonData) {
    nodesById = Immutable.fromJS(jsonData, reviver);
  } else {
    const newTitle = getMapWithId({ type: NODE_TYPE_H1 });
    nodesById = Map().set(newTitle.get('id'), newTitle);
  }

  function getFirstNode() {
    const idSeen = new Set();
    const nextSeen = new Set();
    nodesById.forEach((node) => {
      idSeen.add(node.get('id'));
      if (node.get('next_sibling_id')) {
        nextSeen.add(node.get('next_sibling_id'));
      }
    });
    const difference = new Set([...idSeen].filter((id) => !nextSeen.has(id)));
    if (difference.size !== 1) {
      console.error(
        "DocumentError.getFirstNode() - more than one node isn't pointed to by another node!",
        difference
      );
    }
    const [firstId] = [...difference];
    return nodesById.get(firstId);
  }

  function getLastNode() {
    return nodesById.filter((n) => !n.get('next_sibling_id')).first(Map());
  }

  function getNode(nodeId) {
    if (!nodeId) {
      return Map();
    }
    const node = nodesById.get(nodeId);
    if (node) {
      return node;
    }
    console.warn(`getNode id: ${nodeId} - not found!`);
    return Map();
  }

  function getPrevNode(nodeId) {
    return nodesById
      .filter((n) => n.get('next_sibling_id') === nodeId)
      .first(Map());
  }

  function getNextNode(nodeId) {
    return getNode(getNode(nodeId).get('next_sibling_id'));
  }

  function getNodesBetween(leftNodeId, rightNodeId) {
    const leftNode = getNode(leftNodeId);
    const rightNode = getNode(rightNodeId);
    if (!leftNode.get('id') || !rightNode.get('id')) {
      console.error(
        'getNodesBetween() - must have valid start and end nodes',
        leftNodeId,
        rightNodeId
      );
      return [];
    }
    const middleNodes = [];
    let nextNode = getNextNode(leftNodeId);
    while (nextNode.get('id') !== rightNodeId) {
      middleNodes.push(nextNode);
      nextNode = getNextNode(nextNode.get('id'));
    }
    return middleNodes;
  }

  function isFirstOfType(nodeId) {
    const type = getNode(nodeId).get('type');
    return getPrevNode(nodeId).get('type') !== type;
  }

  function isLastOfType(nodeId) {
    const type = getNode(nodeId).get('type');
    return getNextNode(nodeId).get('type') !== type;
  }

  function isTextType(nodeId) {
    return [
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_PRE,
      NODE_TYPE_P,
      NODE_TYPE_LI,
    ].includes(getNode(nodeId).get('type'));
  }

  function canHaveSelections(nodeId) {
    return [NODE_TYPE_P, NODE_TYPE_LI].includes(getNode(nodeId).get('type'));
  }

  function isMetaType(nodeId) {
    return [NODE_TYPE_SPACER, NODE_TYPE_QUOTE, NODE_TYPE_IMAGE].includes(
      getNode(nodeId).get('type')
    );
  }

  function update(node) {
    const nodeId = node.get('id');
    updateManager.stageNodeUpdate(node);
    nodesById = nodesById.set(nodeId, node);
    return nodeId;
  }

  function insert(
    type,
    neighborNodeId = null,
    content = '',
    meta = Map(),
    shouldInsertAfter = true
  ) {
    const newNode = getMapWithId({
      type,
      content: cleanText(content),
      meta,
    });
    // first node in document
    if (nodesById.size === 0) {
      return update(newNode);
    }
    const neighbor = getNode(neighborNodeId);
    if (!neighbor.get('id')) {
      throw new Error(
        `DocumentModel.insert() - bad neighbor id! ${neighborNodeId}`
      );
    }
    if (shouldInsertAfter) {
      const oldNeighborNext = getNextNode(neighborNodeId);
      update(
        !oldNeighborNext.get('id')
          ? newNode
          : newNode.set('next_sibling_id', oldNeighborNext.get('id'))
      );
      update(neighbor.set('next_sibling_id', newNode.get('id')));
      return newNode.get('id');
    }
    // insert before
    const oldNeighborPrev = getPrevNode(neighborNodeId);
    if (oldNeighborPrev.get('id')) {
      update(oldNeighborPrev.set('next_sibling_id', newNode.get('id')));
    }
    return update(newNode.set('next_sibling_id', neighborNodeId));
  }

  // returns a nodeId to be "focused"
  function deleteNode(node) {
    const nodeId = node.get('id');
    updateManager.stageNodeDelete(node);
    const prevNode = getPrevNode(nodeId);
    const nextNode = getNextNode(nodeId);
    // delete first, then update pointers
    nodesById = nodesById.delete(nodeId);
    // deleting the only node in the document - add back a placeholder
    if (nodesById.size === 0) {
      return insert(NODE_TYPE_H1);
    }
    // deleting somewhere in the middle
    if (prevNode.get('id') && nextNode.get('id')) {
      return update(prevNode.set('next_sibling_id', nextNode.get('id')));
    }
    // deleting last node - unset "next" reference
    if (!nextNode.get('id')) {
      return update(prevNode.delete('next_sibling_id'));
    }
    // else - deleting first node - no next_sibling_id update necessary
    return nextNode.get('id');
  }

  function mergeParagraphs(leftId, rightId) {
    if (!(isTextType(leftId) && isTextType(rightId))) {
      console.error('mergeParagraphs - can`t do it!', leftId, rightId);
      throw new Error('mergeParagraphs - invalid paragraphs');
    }
    let left = getNode(leftId);
    const right = getNode(rightId);
    // do selections before concatenating content!
    if (canHaveSelections(leftId)) {
      left = concatSelections(left, right);
    }
    left = left.set(
      'content',
      `${left.get('content', '')}${right.get('content', '')}`
    );
    update(left);
    deleteNode(right);
  }

  return {
    getFirstNode,
    getLastNode,
    getNode,
    getPrevNode,
    getNextNode,
    getNodesBetween,
    isFirstOfType,
    isLastOfType,
    isTextType,
    canHaveSelections,
    isMetaType,
    update,
    insert,
    deleteNode,
    mergeParagraphs,
  };
};
