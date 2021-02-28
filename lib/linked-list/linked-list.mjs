import immutable from 'immutable';

import { s4 } from '@filbert/util';

const { Map, fromJS } = immutable;

export const LINKED_LIST_HEAD_ID = '__headId';
export const LINKED_LIST_NODES_MAP = '__nodes';
export const LINKED_LIST_NODE_ID = '__id';
export const LINKED_LIST_NODE_NEXT_ID = '__nextId';
export const LINKED_LIST_MAX_SIZE = 65535;

export function getId(node) {
  if (!Map.isMap(node)) {
    throw new Error('LinkedList - id - expected Map()s');
  }
  return node.get(LINKED_LIST_NODE_ID);
}
export function getNextId(node) {
  if (!Map.isMap(node)) {
    throw new Error('LinkedList - nextId - expected Map()s');
  }
  return getNextId(node);
}

export function validate({
  [LINKED_LIST_HEAD_ID]: headId,
  [LINKED_LIST_NODES_MAP]: nodesArg = {},
}) {
  let nodes = fromJS(nodesArg);
  if (!Map.isMap(nodes)) {
    console.error(LINKED_LIST_HEAD_ID, headId, LINKED_LIST_NODES_MAP, nodesArg);
    throw new Error('LinkedList - I only deal in Map()s');
  }
  if (nodes.size === 0 && !headId) {
    // empty list OK
    return Map({
      [LINKED_LIST_HEAD_ID]: undefined,
      [LINKED_LIST_NODES_MAP]: nodes,
    });
  }
  if (!headId) {
    throw new Error('LinkedList - nodes but no head');
  }
  if (nodes.get(headId, Map()).size === 0) {
    throw new Error('LinkedList - headId not found in nodes');
  }
  let seen = new Set();
  let seenNext = new Set();
  nodes.forEach((node, nodeId) => {
    if (nodeId !== getId(node)) {
      throw new Error("LinkedList - nodeId data doesn't match key");
    }
    seen.add(nodeId);
    if (getNextId(node)) {
      if (seenNext.has(getNextId(node))) {
        throw new Error('LinkedList - cycle detected!');
      }
      if (!nodes.has(getNextId(node))) {
        throw new Error('LinkedList - bad next id, not found');
      }
      seenNext.add(getNextId(node));
    }
  });
  const nodeIdsNotLinkedTo = [...seen].filter((id) => !seenNext.has(id));
  if (nodeIdsNotLinkedTo.length > 1) {
    console.error(nodeIdsNotLinkedTo);
    throw new Error('LinkedList - orphaned nodes!');
  }
  if (nodeIdsNotLinkedTo[0] !== headId) {
    console.error('nodes head id', nodeIdsNotLinkedTo[0], 'headId', headId);
    throw new Error(
      "LinkedList - headId doesn't match headId derived from nodes!"
    );
  }
  return Map({ [LINKED_LIST_HEAD_ID]: headId, [LINKED_LIST_NODES_MAP]: nodes });
}

export function linkedListFromJS(obj = {}) {
  return validate(obj);
}

export function size(linkedList) {
  return linkedList.get(LINKED_LIST_NODES_MAP, Map()).size;
}

export function isEmpty(linkedList) {
  return size(linkedList) === 0;
}

export function getNode(linkedList, nodeOrId) {
  if (!Map.isMap(linkedList) || !nodeOrId) {
    return Map();
  }
  const id = typeof nodeOrId === 'string' ? nodeOrId : getId(nodeOrId);
  return linkedList.getIn([LINKED_LIST_NODES_MAP, id], Map());
}

export function getNext(linkedList, nodeOrId) {
  const node = getNode(linkedList, nodeOrId);
  return getNode(linkedList, getNextId(node));
}

export function getAt(linkedList, index) {
  if (index < 0 || index > size(linkedList)) {
    throw new Error('index out of bounds');
  }
  let count = 0;
  let current = head(linkedList);
  while (count < index) {
    count += 1;
    current = getNext(linkedList, current);
  }
  return current;
}

export function getPrev(linkedList, nodeOrId) {
  const node = getNode(linkedList, nodeOrId);
  let current = head(linkedList);
  while (current.size > 0) {
    if (getNextId(current) === getId(node)) {
      return current;
    }
    current = getNext(linkedList, current);
  }
  return Map();
}

export function replace(linkedList, node) {
  if (getNode(linkedList, node).size === 0) {
    throw new Error(`Node not found!\n${JSON.stringify(node)}`);
  }
  if (getNextId(node) && !getNode(linkedList, getNextId(node)).size === 0) {
    throw new Error(`Next not found!\n${JSON.stringify(node)}`);
  }
  return linkedList.setIn([LINKED_LIST_NODES_MAP, getId(node)], node);
}

export function createNode(linkedList, data = {}) {
  if (
    linkedList.get(LINKED_LIST_NODES_MAP, Map()).size + 1 >
    LINKED_LIST_MAX_SIZE
  ) {
    throw new Error(
      `Can't create Node - Linked List is at max capacity of ${LINKED_LIST_MAX_SIZE} nodes.`
    );
  }
  let node = Map(data);
  let newId = s4();
  while (getNode(linkedList, newId).size > 0) {
    // avoid id collisions
    newId = s4();
  }
  return node.set(LINKED_LIST_NODE_ID, newId);
}

export function head(linkedList) {
  return getNode(linkedList, linkedList.get(LINKED_LIST_HEAD_ID));
}

export function isHead(linkedList, maybeHead) {
  return head(linkedList).equals(maybeHead);
}

export function tail(linkedList) {
  if (size(linkedList) === 0) {
    return Map();
  }
  return getAt(linkedList, size(linkedList) - 1);
}

export function isTail(linkedList, maybeTail) {
  return tail(linkedList).equals(maybeTail);
}

// adds an element to the end of the list
export function append(linkedList, data = {}) {
  let node = Map(data);
  if (!getId(node)) {
    // create a new map with id
    node = createNode(linkedList, data);
  }

  // new node must be the tail
  node = node.remove(LINKED_LIST_NODE_NEXT_ID);
  // to store current node
  let current;
  // if list is Empty add the element and make it head
  const h = head(linkedList);
  if (h.size === 0) {
    linkedList = linkedList.set(LINKED_LIST_HEAD_ID, getId(node));
  } else {
    current = tail(linkedList);
    // update previous tail
    current = current.set(LINKED_LIST_NODE_NEXT_ID, getId(node));
    linkedList = replace(linkedList, current);
  }
  return {
    node,
    linkedList: linkedList.setIn([LINKED_LIST_NODES_MAP, getId(node)], node),
  };
}

// insert at index
export function insertAt(linkedList, data, index) {
  if (index < 0 || index > size(linkedList)) {
    throw new Error('index out of bounds');
  }

  // creates a new node
  let node = createNode(linkedList, data);

  // add the element to the
  // first index
  if (index === 0) {
    node = node.set(LINKED_LIST_NODE_NEXT_ID, getId(head(linkedList)));
    linkedList = linkedList
      .set(LINKED_LIST_HEAD_ID, getId(node))
      .setIn([LINKED_LIST_NODES_MAP, getId(node)], node);
    return { node, linkedList };
  }

  let prev;
  let current = head(linkedList);
  let i = 0;

  // iterate over the list to find the position to insert
  while (i < index && current.size > 0) {
    i += 1;
    prev = current;
    current = getNext(linkedList, current);
  }

  // adding an element
  if (current) {
    node = node.set(LINKED_LIST_NODE_NEXT_ID, getId(current));
  }
  linkedList = linkedList.setIn([LINKED_LIST_NODES_MAP, getId(node)], node);
  prev = prev.set(LINKED_LIST_NODE_NEXT_ID, getId(node));
  linkedList = replace(linkedList, prev);
  return { node, linkedList };
}

// finds the index of element
export function indexOf(linkedList, nodeOrId) {
  let count = 0;
  let current = head(linkedList);
  const node = getNode(linkedList, nodeOrId);

  while (current.size > 0) {
    if (getId(current) === getId(node)) {
      return count;
    }
    count += 1;
    current = getNext(linkedList, current);
  }

  // not found
  return -1;
}

export function insertBefore(linkedList, data, nodeOrId) {
  const prev = getPrev(linkedList, nodeOrId);
  if (prev.size === 0) {
    // new head
    return insertAt(linkedList, data, 0);
  }
  return insertAt(linkedList, data, indexOf(linkedList, prev));
}

export function insertAfter(linkedList, data, nodeOrId) {
  const idx = indexOf(linkedList, nodeOrId);
  if (idx === -1) {
    console.error(data, nodeOrId);
    throw new Error('LinkedList - insertAfter - out of bounds');
  }
  return insertAt(linkedList, data, idx + 1);
}

// removes a given node by node or id
export function remove(linkedList, nodeOrId) {
  const idx = indexOf(linkedList, nodeOrId);
  return removeAt(linkedList, idx);
}

// removes an element from the specified location
export function removeAt(linkedList, index) {
  if (index < 0 || index >= size(linkedList)) {
    throw new Error('LinkedList - removeAt - index out of bounds');
  }

  let current = head(linkedList);
  let prev;
  let i = 0;

  // deleting first element
  if (index === 0) {
    linkedList = linkedList.set(
      LINKED_LIST_HEAD_ID,
      getId(getNext(linkedList, current))
    );
  } else {
    // iterate over the list to find an element
    while (i < index) {
      i += 1;
      prev = current;
      current = getNext(linkedList, current);
    }

    // remove the element
    prev = prev.set(LINKED_LIST_NODE_NEXT_ID, getNextId(current));
    linkedList = replace(linkedList, prev);
  }
  linkedList = linkedList.removeIn([LINKED_LIST_NODES_MAP, getId(current)]);
  return linkedList;
}
