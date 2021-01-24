import immutable from 'immutable';

import { s4 } from '@filbert/util';

const { Map, fromJS } = immutable;

// User defined class node
class Node {
  // constructor
  constructor(values, reviver) {
    this.id = values.__id;
    this.next = values.__next;
    this.values = fromJS(values, reviver).remove('__id').remove('__next');
  }
  get id() {
    return this.__id;
  }
  set id(val) {
    this.__id = val;
    return this;
  }
  get next() {
    return this.__next;
  }
  set next(val) {
    this.__next = val;
    return this;
  }

  toJSON() {
    return { ...this.values.toJS(), __id: this.id, __next: this.next };
  }
}

export class LinkedList {
  constructor(head, nodes = {}) {
    this.nodes = Map(nodes);
    this.head = head;
  }

  maxSize = 65000;

  getNode(nodeOrId) {
    return (
      nodeOrId &&
      (typeof nodeOrId === 'string'
        ? this.nodes.get(nodeOrId)
        : this.nodes.get(nodeOrId.id))
    );
  }
  getNext(nodeOrId) {
    const node = this.getNode(nodeOrId);
    return this.getNode(node.next);
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
    this.nodes = this.nodes.set(node.id, node);
    return this;
  }

  createNode(data) {
    if (this.nodes.size + 1 > this.maxSize) {
      throw new Error(
        `Can't create Node - Linked List is at max capacity of ${this.maxSize} nodes.`
      );
    }
    let newId = s4();
    do {
      // avoid id collisions
      newId = s4();
    } while (this.nodes[newId]);

    return new Node({ ...data, __id: newId });
  }

  // adds an element to the end of the list
  append(data) {
    let node = this.createNode(data);
    // to store current node
    let current;

    // if list is Empty add the
    // element and make it head
    if (!this.head) {
      this.head = node;
    } else {
      current = this.head;

      // iterate to the end of the
      // list
      while (current.next) {
        current = this.getNext(current);
      }

      // add node
      current.next = node.id;
      this.setNode(current);
    }
    this.setNode(node);
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
      this.setNode(node);
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
    this.setNode(node);
    prev.next = node;
    this.setNode(prev);
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
    return { head: this.head && this.head, nodes: this.nodes.toJS() };
  }
  static fromJSON(json, reviver) {
    const { head, nodes: nodesObj } = JSON.parse(json);
    const nodes = Map(nodesObj).map((nodeRaw) => new Node(nodeRaw, reviver));
    return new LinkedList(nodes.get(head.__id), nodes);
  }
}
