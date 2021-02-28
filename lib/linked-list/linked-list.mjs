import immutable from 'immutable';

import { s4 } from '@filbert/util';

const { Map, fromJS } = immutable;

export const LINKED_LIST_HEAD = '__head';
export const LINKED_LIST_NODES_MAP = '__nodes';
export const LINKED_LIST_NODE_ID = '__id';
export const LINKED_LIST_NODE_NEXT = '__next';
export const LINKED_LIST_MAX_SIZE = 65535;

function validate({ head: headArg, nodes: nodesArg }) {
  let head = fromJS(headArg);
  let nodes = fromJS(nodesArg);
  if (!Map.isMap(head) || !Map.isMap(nodes)) {
    console.error('head', headArg, 'nodes', nodesArg);
    throw new Error('LinkedList - I only deal in Map()s');
  }
  if (nodes.size === 0 && head.size === 0) {
    // empty list OK
    return;
  }
  if (head.size === 0) {
    throw new Error('LinkedList - nodes but no head');
  }
  if (!nodes.get(head.get(LINKED_LIST_NODE_ID)).equals(head)) {
    throw new Error(
      "LinkedList - head Map values doesn't match nodes[head.id] values"
    );
  }
  let seen = new Set();
  let seenNext = new Set();
  nodes.forEach((node, nodeId) => {
    if (nodeId !== node.get(LINKED_LIST_NODE_ID)) {
      throw new Error("LinkedList - nodeId data doesn't match key");
    }
    seen.add(nodeId);
    if (node.get(LINKED_LIST_NODE_NEXT)) {
      if (seenNext.has(node.get(LINKED_LIST_NODE_NEXT))) {
        throw new Error('LinkedList - cycle detected!');
      }
      if (!nodes.has(node.get(LINKED_LIST_NODE_NEXT))) {
        throw new Error('LinkedList - bad next id, not found');
      }
      seenNext.add(node.get(LINKED_LIST_NODE_NEXT));
    }
  });
  const nodeIdsNotLinkedTo = [...seen].filter((id) => !seenNext.has(id));
  if (nodeIdsNotLinkedTo.length > 1) {
    console.error(nodeIdsNotLinkedTo);
    throw new Error('LinkedList - orphaned nodes!');
  }
  if (nodeIdsNotLinkedTo[0] !== head.get(LINKED_LIST_NODE_ID)) {
    console.error(
      'nodes head id',
      nodeIdsNotLinkedTo[0],
      'head id',
      head.get(LINKED_LIST_NODE_ID)
    );
    throw new Error(
      "LinkedList - head id doesn't match head derived from nodes!"
    );
  }
  return Map({ head, nodes });
}

function linkedListFromJS(obj) {
  return validate(obj);
}

function size(linkedList) {
  return linkedList.get(LINKED_LIST_NODES_MAP).size;
}

function isEmpty(linkedList) {
  return size(linkedList) === 0;
}

function getNode(linkedList, nodeOrId) {
  if (!Map.isMap(linkedList) || !nodeOrId) {
    return;
  }
  const id =
    typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.get(LINKED_LIST_NODE_ID);
  return linkedList.getIn(['nodes', id], Map());
}

function getNext(linkedList, nodeOrId) {
  const node = getNode(linkedList, nodeOrId);
  return getNode(linkedList, node.get(LINKED_LIST_NODE_NEXT));
}

function getAt(linkedList, index) {
  if (index < 0 || index > size(linkedList)) {
    throw new Error('index out of bounds');
  }
  let count = 0;
  let current = linkedList.get(LINKED_LIST_HEAD);
  while (count < index) {
    count += 1;
    current = getNext(linkedList, current);
  }
  return current;
}

function getPrev(linkedList, nodeOrId) {
  const node = getNode(linkedList, nodeOrId);
  let current = linkedList.get(LINKED_LIST_HEAD);
  while (current) {
    if (current.get(LINKED_LIST_NODE_NEXT) === node.get(LINKED_LIST_NODE_ID)) {
      return current;
    }
    current = getNext(linkedList, current);
  }
}

function replace(linkedList, node) {
  if (getNode(linkedList, node).size === 0) {
    throw new Error(`Node not found!\n${JSON.stringify(node)}`);
  }
  if (
    node.get(LINKED_LIST_NODE_NEXT) &&
    !getNode(linkedList, node[LINKED_LIST_NODE_NEXT]).size === 0
  ) {
    throw new Error(`Next not found!\n${JSON.stringify(node)}`);
  }
  return linkedList.setIn(
    [LINKED_LIST_NODES_MAP, node.get(LINKED_LIST_NODE_ID)],
    node
  );
}

function createNode(linkedList, data = {}) {
  if (linkedList.get(LINKED_LIST_NODES_MAP).size + 1 > LINKED_LIST_MAX_SIZE) {
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

function head(linkedList) {
  return linkedList.get(LINKED_LIST_HEAD, Map());
}

function isHead(linkedList, maybeHead) {
  return head(linkedList).equals(maybeHead);
}

function tail(linkedList) {
  if (size(linkedList) === 0) {
    return Map();
  }
  return getAt(linkedList, size(linkedList) - 1);
}

function isTail(linkedList, maybeTail) {
  return tail(linkedList).equals(maybeTail);
}

// adds an element to the end of the list
function append(linkedList, data = {}) {
  let node = Map(data);
  if (!node.get(LINKED_LIST_NODE_ID)) {
    // create a new map with id
    node = createNode(linkedList, data);
  }

  // new node must be the tail
  node = node.set(LINKED_LIST_NODE_NEXT, undefined);
  // to store current node
  let current;
  // if list is Empty add the element and make it head
  const head = linkedList.get(LINKED_LIST_HEAD, Map());
  if (head.size === 0) {
    linkedList = linkedList.set(LINKED_LIST_HEAD, node);
  } else {
    current = tail(linkedList);
    // update previous tail
    current = current.set(LINKED_LIST_NODE_NEXT, node.get(LINKED_LIST_NODE_ID));
    linkedList = replace(linkedList, current);
  }
  return {
    node,
    linkedList: linkedList.setIn(
      [LINKED_LIST_NODES_MAP, node.get(LINKED_LIST_NODE_ID)],
      node
    ),
  };
}

// insert at index
function insertAt(linkedList, data, index) {
  if (index < 0 || index > size(linkedList)) {
    throw new Error('index out of bounds');
  }

  // creates a new node
  let node = createNode(linkedList, data);

  // add the element to the
  // first index
  if (index === 0) {
    node = node.set(
      LINKED_LIST_NODE_NEXT,
      head(linkedList).get(LINKED_LIST_NODE_ID)
    );
    linkedList = linkedList
      .set(LINKED_LIST_HEAD, node)
      .setIn([LINKED_LIST_NODES_MAP, node.get(LINKED_LIST_NODE_ID)], node);
    return { linkedList, node };
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
  node = node.set(LINKED_LIST_NODE_NEXT, current.get(LINKED_LIST_NODE_ID));
  linkedList = replace(linkedList, node);
  prev = prev.set(LINKED_LIST_NODE_NEXT, node.get(LINKED_LIST_NODE_ID));
  linkedList = replace(linkedList, prev);
  return { node, linkedList };
}

// finds the index of element
function indexOf(linkedList, nodeOrId) {
  let count = 0;
  let current = head(linkedList);
  const node = getNode(linkedList, nodeOrId);

  while (current.size > 0) {
    if (current.get(LINKED_LIST_NODE_ID) === node.get(LINKED_LIST_NODE_ID)) {
      return count;
    }
    count += 1;
    current = getNext(linkedList, current);
  }

  // not found
  return -1;
}

function insertBefore(linkedList, data, nodeOrId) {
  const prev = getPrev(linkedList, nodeOrId);
  if (prev.size === 0) {
    // new head
    return insertAt(linkedList, data, 0);
  }
  return insertAt(linkedList, data, indexOf(linkedList, prev));
}

function insertAfter(linkedList, data, nodeOrId) {
  const idx = indexOf(linkedList, nodeOrId);
  if (idx === -1) {
    console.error(data, nodeOrId);
    throw new Error('LinkedList - insertAfter - out of bounds');
  }
  return insertAt(linkedList, data, idx + 1);
}

// removes a given node by node or id
function remove(linkedList, nodeOrId) {
  const id =
    typeof nodeOrId === 'string' ? nodeOrId : nodeOrId.get(LINKED_LIST_NODE_ID);
  return linkedList.removeIn([LINKED_LIST_NODES_MAP, id]);
}

// removes an element from the specified location
function removeAt(linkedList, index) {
  if (index < 0 || index >= size(linkedList)) {
    throw new Error('LinkedList - removeAt - index out of bounds');
  }

  let current = head(linkedList);
  let prev;
  let i = 0;

  // deleting first element
  if (index === 0) {
    linkedList = linkedList.set(LINKED_LIST_HEAD, getNext(linkedList, current));
  } else {
    // iterate over the list to find an element
    while (i < index) {
      i += 1;
      prev = current;
      current = getNext(linkedList, current);
    }

    // remove the element
    prev = prev.set(LINKED_LIST_NODE_NEXT, current.get(LINKED_LIST_NODE_NEXT));
    linkedList = replace(linkedList, prev);
  }
  linkedList = remove(linkedList, current);
  return linkedList;
}
