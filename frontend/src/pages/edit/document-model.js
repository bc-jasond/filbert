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

export function getFirstNode(nodesById) {
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

export function getLastNode(nodesById) {
  return nodesById.filter((n) => !n.get('next_sibling_id')).first(Map());
}

export default function DocumentManager(postId, jsonData = null) {
  let nodesById;

  if (jsonData) {
    nodesById = Immutable.fromJS(jsonData, reviver);
  } else {
    const newTitle = getMapWithId({ type: NODE_TYPE_H1 });
    nodesById = Map().set(newTitle.get('id'), newTitle);
  }

  function isUnsavedPost() {
    return postId === NEW_POST_URL_ID;
  }

  function getNodes() {
    return nodesById;
  }

  function setNodes(value) {
    nodesById = value;
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

  // TODO: alternatively, create diff between old and new nodes here, or a log of all changes.
  //  The resolution of these changes will be too small for undo/redo but, maybe there's a way
  //  to "compact" the data afterward.  Otherwise, undo/redo data can be created and stored in
  //  commitUpdates() like it is currently.
  function update(node) {
    const nodeId = node.get('id');
    const prevState = nodesById.get(nodeId, undefined); // can be undefined on insert
    nodesById = nodesById.set(nodeId, node);
    return [{ unexecuteState: prevState, executeState: node }];
  }

  /**
   * last entry in array executeState is the newly inserted node ("currentNode" for focus)
   *
   * @param type
   * @param neighborNodeId
   * @param content
   * @param meta
   * @param shouldInsertAfter
   * @returns {[]|number}
   */
  function insert(
    type,
    neighborNodeId = null,
    content = '',
    meta = Map(),
    shouldInsertAfter = true
  ) {
    const history = [];
    const newNode = getMapWithId({
      post_id: postId,
      type,
      content: cleanText(content),
      meta,
    });
    // first node in document
    if (nodesById.size === 0) {
      history.push(...update(newNode));
      return history;
    }
    const neighbor = getNode(neighborNodeId);
    if (!neighbor.get('id')) {
      throw new Error(
        `DocumentModel.insert() - bad neighbor id! ${neighborNodeId}`
      );
    }
    if (shouldInsertAfter) {
      const oldNeighborNext = getNextNode(neighborNodeId);
      history.push(
        ...update(neighbor.set('next_sibling_id', newNode.get('id')))
      );
      history.push(
        ...update(
          !oldNeighborNext.get('id')
            ? newNode
            : newNode.set('next_sibling_id', oldNeighborNext.get('id'))
        )
      );
      return history;
    }
    // insert before
    const oldNeighborPrev = getPrevNode(neighborNodeId);
    if (oldNeighborPrev.get('id')) {
      history.push(
        ...update(oldNeighborPrev.set('next_sibling_id', newNode.get('id')))
      );
    }
    return history.push(
      ...update(newNode.set('next_sibling_id', neighborNodeId))
    );
  }

  // returns a nodeId to be "focused"
  function deleteNode(node) {
    const history = [];
    const nodeId = node.get('id');
    const prevNode = getPrevNode(nodeId);
    const nextNode = getNextNode(nodeId);
    // delete first, then update pointers
    history.push({ unexecuteState: node, executeState: undefined });
    nodesById = nodesById.delete(nodeId);

    // deleting the only node in the document - add back a placeholder
    if (nodesById.size === 0) {
      history.push(...insert(NODE_TYPE_H1));
    }
    // deleting somewhere in the middle
    else if (prevNode.get('id') && nextNode.get('id')) {
      history.push(
        ...update(prevNode.set('next_sibling_id', nextNode.get('id')))
      );
    }
    // deleting last node - unset "next" reference
    else if (!nextNode.get('id')) {
      history.push(...update(prevNode.delete('next_sibling_id')));
    } else {
      // deleting first node - no next_sibling_id update necessary
      history.push({ unexecuteState: nextNode, executeState: nextNode });
    }
    return history;
  }

  function mergeParagraphs(leftId, rightId) {
    if (!(isTextType(leftId) && isTextType(rightId))) {
      console.error('mergeParagraphs - can`t do it!', leftId, rightId);
      throw new Error('mergeParagraphs - invalid paragraphs');
    }
    const history = [];
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
    history.push(...update(left));
    history.push(...deleteNode(right));
    return history;
  }

  return {
    isUnsavedPost,
    getNodes,
    setNodes,
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
}
