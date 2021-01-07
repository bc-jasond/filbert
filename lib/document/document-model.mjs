import Immutable, { Map } from 'immutable';

import { cleanText, getMapWithId, deleteContentRange } from '@filbert/util';
import {
  adjustSelectionOffsetsAndCleanup,
  concatSelections,
  reviver,
} from '@filbert/selection';

// for document container
export const NODE_TYPE_ROOT = 'root';

// sections that can have text content
export const NODE_TYPE_H1 = 'h1';
export const NODE_TYPE_H2 = 'h2';
export const NODE_TYPE_P = 'p';
export const NODE_TYPE_PRE = 'pre';
export const NODE_TYPE_LI = 'li';

// sections that have "meta" content
export const NODE_TYPE_SPACER = 'spacer';
export const NODE_TYPE_IMAGE = 'image';
export const NODE_TYPE_QUOTE = 'quote';

// sections that are containers only - no content
export const NODE_TYPE_CONTENT = 'content';
export const NODE_TYPE_OL = 'ol';
export const NODE_TYPE_CODE = 'code';

export function fixOrphanedNodes(nodesById) {
  const orphanedNodes = getOrphanedNodes(nodesById);
  if (orphanedNodes.length === 1) {
    return nodesById;
  }

  function getEndNode(nodeId) {
    let current = nodesById.get(nodeId);
    let last;
    const seen = new Set();
    while (
      current &&
      current.get('next_sibling_id') &&
      !seen.has(current.get('next_sibling_id'))
    ) {
      seen.add(current.get('next_sibling_id'));
      last = current;
      current = nodesById.get(current.get('next_sibling_id'));
    }
    return current ?? last;
  }
  // at least one orphaned node (besides the first node)
  const orphanIdsDescendingByListLength = orphanedNodes
    .map((id) => ({ id, len: getNodeListLength(nodesById, id) }))
    .sort(({ len: lenLeft }, { len: lenRight }) =>
      lenLeft > lenRight ? -1 : 1
    )
    .map(({ id }) => id);

  for (let i = 1; i < orphanIdsDescendingByListLength.length; i++) {
    const prevId = orphanIdsDescendingByListLength[i - 1];
    const currentId = orphanIdsDescendingByListLength[i];
    const prevEndNode = getEndNode(prevId);
    nodesById = nodesById.set(
      prevEndNode.get('id'),
      prevEndNode.set('next_sibling_id', currentId)
    );
  }

  return nodesById;
}

export function getOrphanedNodes(nodesById) {
  const idSeen = new Set();
  const nextSeen = new Set();
  if (!Map.isMap(nodesById)) {
    console.error('getOrphanedNodes() - bad nodesById', nodesById);
    return [];
  }
  nodesById.forEach((node) => {
    idSeen.add(node.get('id'));
    if (
      node.get('next_sibling_id') &&
      nodesById.get(node.get('next_sibling_id'))
    ) {
      nextSeen.add(node.get('next_sibling_id'));
    }
  });
  return [...idSeen].filter((id) => !nextSeen.has(id));
}

export function getFirstNode(nodesById) {
  const difference = getOrphanedNodes(nodesById);
  if (difference.length !== 1) {
    console.error(
      `${nodesById
        .get(difference[0])
        .get(
          'post_id'
        )} DocumentError.getFirstNode() - more than one node isn't pointed to by another node!`,
      difference.reduce(
        (acc, id) =>
          `${acc}${id} - ${getNodeListLength(nodesById, id)} nodes, `,
        ''
      )
    );
  }
  // best effort: return the head with the longest list
  const [{ id: firstId }] = difference
    .map((id) => ({ id, len: getNodeListLength(nodesById, id) }))
    .sort(({ len: lenLeft }, { len: lenRight }) =>
      lenLeft > lenRight ? -1 : 1
    );
  return nodesById.get(firstId);
}

export function getLastNode(nodesById) {
  return nodesById.filter((n) => !n.get('next_sibling_id')).first(Map());
}

export function getPrevNode(nodesById, currentId) {
  return nodesById.find((n) => n.get('next_sibling_id') === currentId);
}

export function getNodeListLength(nodesById, nodeId) {
  let count = 1;
  let current = nodesById.get(nodeId);
  let nextId = current.get('next_sibling_id');
  const seen = new Set();
  while (nextId && !seen.has(nextId)) {
    seen.add(nextId);
    count += 1;
    current = nodesById.get(nextId);
    nextId = current?.get?.('next_sibling_id');
  }
  return count;
}

export function DocumentModel(postId, jsonData = null) {
  let nodesById = Map();
  let lastInsertId;

  if (jsonData) {
    nodesById = Immutable.fromJS(jsonData, reviver);
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
    //console.warn(`getNode id: ${nodeId} - not found!`);
    return Map();
  }

  function getLastInsertId() {
    return lastInsertId;
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

  function isOrphan(nodeId) {
    return !nodesById.some((node) => node.get('next_sibling_id') === nodeId);
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
    const prevNextId = prevState?.get?.('next_sibling_id');
    const prevNextNode = nodesById.get(prevNextId);
    const newNextId = node.get('next_sibling_id');
    const newNextNode = nodesById.get(newNextId);
    if (newNextId && !newNextNode) {
      if (prevNextId && prevNextNode) {
        console.warn(
          'DocumentModel.update() bad next_sibling_id - found previous node, using previous value',
          node.toJS()
        );
        node = node.set('next_sibling_id', prevNextId);
      } else {
        console.warn(
          'DocumentModel.update() bad next_sibling_id - unsetting',
          node.toJS()
        );
        node = node.set('next_sibling_id', undefined);
      }
    }
    nodesById = nodesById.set(nodeId, node);
    return [node];
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
    lastInsertId = newNode.get('id');
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
        ...update(
          !oldNeighborNext.get('id')
            ? newNode
            : newNode.set('next_sibling_id', oldNeighborNext.get('id'))
        )
      );
      history.push(
        ...update(neighbor.set('next_sibling_id', newNode.get('id')))
      );
      return history;
    }
    // insert before
    history.push(...update(newNode.set('next_sibling_id', neighborNodeId)));
    const oldNeighborPrev = getPrevNode(neighborNodeId);
    if (oldNeighborPrev.get('id')) {
      history.push(
        ...update(oldNeighborPrev.set('next_sibling_id', newNode.get('id')))
      );
    }
    return history;
  }

  function deleteNode(node) {
    const history = [];
    const nodeId = node.get('id');
    const prevNode = getPrevNode(nodeId);
    const nextNode = getNextNode(nodeId);

    // don't delete last node in document, reset it to an empty title
    if (!prevNode.size && !nextNode.size) {
      history.push(
        ...update(
          node.set('type', NODE_TYPE_H1).set('content', '').set('meta', Map())
        )
      );
      return history;
    }
    // update pointers first
    // deleting somewhere in the middle
    if (prevNode.get('id') && nextNode.get('id')) {
      history.push(
        ...update(prevNode.set('next_sibling_id', nextNode.get('id')))
      );
    }
    // deleting last node - unset "next" reference
    else if (!nextNode.get('id')) {
      history.push(...update(prevNode.delete('next_sibling_id')));
    }

    // delete node only after it's been orphaned
    history.push(nodeId);
    nodesById = nodesById.delete(nodeId);

    return history;
  }

  // returns a nodeId for node deleted, false for node updated
  function deleteNodeContentRangeAndUpdateSelections(
    diffLength,
    nodeId,
    startIdx
  ) {
    let node = getNode(nodeId);
    const content = node.get('content', '');
    /* TODO: delete node under if all content has been highlighted
    if (startIdx === 0 && diffLength >= content.length) {
      return documentModel.deleteNode(node);
    } */
    // only some of endNode's content has been selected, delete that content
    node = node.set(
      'content',
      deleteContentRange(content, startIdx, diffLength)
    );
    node = adjustSelectionOffsetsAndCleanup(
      node,
      content,
      startIdx + diffLength,
      // -1 for "regular" backspace to delete 1 char
      diffLength === 0 ? -1 : -diffLength
    );
    return update(node);
  }

  // given selectionOffsets - return 2 boolean values for {willDeleteStartNode, willDeleteEndNode}
  function willDeleteStartAndEnd({
    startNodeId,
    caretStart,
    endNodeId,
    caretEnd,
  }) {
    const willDeleteStartNode =
      isMetaType(startNodeId) ||
      (endNodeId && caretStart === 0) ||
      (caretStart === 0 &&
        caretEnd === getNode(startNodeId).get('content', '').length);
    const willDeleteEndNode =
      endNodeId &&
      (isMetaType(endNodeId) ||
        caretEnd === getNode(endNodeId).get('content', '').length);
    return { willDeleteStartNode, willDeleteEndNode };
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
    getNodes,
    setNodes,
    getNode,
    getLastInsertId,
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
    deleteNodeContentRangeAndUpdateSelections,
    willDeleteStartAndEnd,
    mergeParagraphs,
  };
}
