import immutable from 'immutable';

import { s4 } from '@filbert/util';

const { Map, fromJS } = immutable;

export const LINKED_LIST_NODE_ID = '__id';
export const LINKED_LIST_NODE_NEXT = '__next';

// User defined class node
export class LinkedListNode {
  // constructor
  constructor(data) {
    this.values =
      data instanceof LinkedListNode
        ? data.values
        : fromJS(data || {});
  }
  get id() {
    return this.values.get(LINKED_LIST_NODE_ID);
  }
  set id(val) {
    return this.setValue(LINKED_LIST_NODE_ID, val);
  }
  get next() {
    return this.values.get(LINKED_LIST_NODE_NEXT);
  }
  set next(val) {
    return this.setValue(LINKED_LIST_NODE_NEXT, val);
  }
  get values() {
    return this.__values;
  }
  set values(values) {
    this.__values = values;
    return this;
  }
  setValue(key, value) {
    if (value === false || value === undefined) {
      this.values = this.values.remove(key);
    } else {
      this.values = this.values.set(key, value);
    }
    return this;
  }
  copy() {
    return new LinkedListNode(this.toJSON());
  }
  equals(that) {
    if (!that instanceof LinkedListNode) {
      return false;
    }
    return (
      this.id === that.id &&
      this.next === that.next &&
      this.values.equals(that.values)
    );
  }

  toJSON() {
    return {
      ...this.values.toJS(),
    };
  }
}

export class LinkedList {
  constructor(head, nodes = {}, NodeClass = LinkedListNode) {
    this.head = head;
    this.nodes = Map(nodes);
    this.NodeClass = NodeClass;
  }

  maxSize = 65000;

  getNode(nodeOrId) {
    if (!nodeOrId) {
      return;
    }
    return typeof nodeOrId === 'string'
      ? this.nodes.get(nodeOrId)
      : this.nodes.get(nodeOrId.id);
  }
  getNext(nodeOrId) {
    const node = this.getNode(nodeOrId);
    return this.getNode(node.next);
  }
  getAt(index) {
    if (index < 0 || index > this.nodes.size) {
      throw new Error('index out of bounds');
    }
    let count = 0;
    let current = this.head;
    while (count < index) {
      count += 1;
      current = this.getNext(current);
    }
    return current;
  }
  getPrev(nodeOrId) {
    const node = this.getNode(nodeOrId);
    let current = this.head;
    while (current) {
      if (current.next === node.id) {
        return current;
      }
      current = this.getNext(current);
    }
  }

  setNode(node) {
    if (!this.nodes.get(node?.id)) {
      throw new Error(`Node not found!\n${JSON.stringify(node)}`);
    }
    if (node.next && !this.nodes.get(node.next)) {
      throw new Error(`Next not found!\n${JSON.stringify(node)}`);
    }
    this.nodes = this.nodes.set(node.id, node);
    return this;
  }

  createNode(data = {}) {
    if (this.nodes.size + 1 > this.maxSize) {
      throw new Error(
        `Can't create Node - Linked List is at max capacity of ${this.maxSize} nodes.`
      );
    }
    let newId = s4();
    while (this.nodes[newId]) {
      // avoid id collisions
      newId = s4();
    }

    return new this.NodeClass({...data, [LINKED_LIST_NODE_ID]: newId });
  }

  get tail() {
    return this.getAt(this.size - 1);
  }
  set tail(v) {
    throw new Error('use append()');
  }
  // adds an element to the end of the list
  append(data = {}) {
    let node;
    if (data.hasOwnProperty('id')) {
      // already an instance of NodeClass
      node = data;
    } else if (data[LINKED_LIST_NODE_ID]) {
      // fromJSON if there's an __id
      node = new this.NodeClass(data);
    } else {
      // no id, new id & values
      node = this.createNode(data);
    }

    // new node must be the tail
    node.next = undefined;
    // to store current node
    let current;
    // if list is Empty add the element and make it head
    if (!this.head) {
      this.head = node;
    } else {
      current = this.head;

      // iterate to the end of the list
      while (current.next) {
        current = this.getNext(current);
      }

      // update previous tail
      current.next = node.id;
      this.nodes = this.nodes.set(current.id, current);
    }
    this.nodes = this.nodes.set(node.id, node);
    return node;
  }

  // insert at index
  insertAt(data, index) {
    if (index < 0 || index > this.nodes.size) {
      throw new Error('index out of bounds');
    }

    // creates a new node
    let node = this.createNode(data);

    // add the element to the
    // first index
    if (index === 0) {
      node.next = this.head;
      this.head = node;
      this.nodes = this.nodes.set(node.id, node);
      return node;
    }

    let prev;
    let current = this.head;
    let i = 0;

    // iterate over the list to find the position to insert
    while (i < index && current) {
      i += 1;
      prev = current;
      current = this.getNext(current);
    }

    // adding an element
    node.next = current;
    this.nodes = this.nodes.set(node.id, node);
    prev.next = node.id;
    this.nodes = this.nodes.set(prev.id, prev);
    return node;
  }

  insertBefore(data, nodeOrId) {
    const prev = this.getPrev(nodeOrId);
    if (!prev) {
      // new head
      return this.insertAt(data, 0);
    }
    return this.insertAt(data, this.indexOf(prev));
  }
  insertAfter(data, nodeOrId) {
    const idx = this.indexOf(nodeOrId);
    return this.insertAt(data, idx + 1);
  }

  // removes an element from the specified location
  removeAt(index) {
    if (index < 0 || index >= this.nodes.size) {
      console.warn('Index out of bounds');
      return this;
    }

    let current = this.head;
    let prev;
    let i = 0;

    // deleting first element
    if (index === 0) {
      this.head = this.getNext(current);
    } else {
      // iterate over the list to find an element
      while (i < index) {
        i += 1;
        prev = current;
        current = this.getNext(current);
      }

      // remove the element
      prev.next = current.next;
      this.setNode(prev);
    }
    this.nodes = this.nodes.remove(current.id);
    return this;
  }

  // removes a given node by node or id
  remove(nodeOrId) {
    const node = this.getNode(nodeOrId);
    const index = this.indexOf(node);
    return this.removeAt(index);
  }

  // finds the index of element
  indexOf(nodeOrId) {
    let count = 0;
    let current = this.head;
    const node = this.getNode(nodeOrId);

    while (current) {
      if (current.id === node.id) {
        return count;
      }
      count += 1;
      current = this.getNext(current);
    }

    // not found
    return -1;
  }

  isHead(maybeHead) {
    return maybeHead === this.head;
  }
  isTail(maybeTail) {
    return this.indexOf(maybeTail) === this.size - 1;
  }

  get size() {
    return this.nodes.size;
  }

  isEmpty() {
    return this.nodes.size === 0;
  }

  // pretty print
  toString() {
    return `LinkedList ${JSON.stringify(this, null, 2)}`;
  }

  toJSON() {
    return { head: this.head, nodes: this.nodes.toJS() };
  }
  static fromJSON(json) {
    const { head: headData, nodes: nodesObj = {} } = JSON.parse(json);
    const head = new LinkedListNode(headData);
    const nodes = Map(nodesObj).map((nodeRaw) => new LinkedListNode(nodeRaw));
    return new LinkedList(nodes.get(head.id), nodes);
  }
}
