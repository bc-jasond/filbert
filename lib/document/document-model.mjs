import immutable from 'immutable';

import { LinkedList, LinkedListNode } from '@filbert/linked-list';
import { FormatSelections } from '@filbert/selection';
import { cleanText } from '@filbert/util';

const { Map } = immutable;

// Document Node keys
export const NODE_POST_ID = 'postId';
export const NODE_CONTENT = 'content';
export const NODE_TYPE = 'type';
export const NODE_FORMAT_SELECTIONS = 'formatSelections';
export const NODE_META = 'meta';

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
export const NODE_TYPE_CODE = 'code';

export class DocumentModelNode extends LinkedListNode {
  constructor(data = {}) {
    super(data);
  }
  get postId() {
    return this.values.get(NODE_POST_ID);
  }
  set postId(v) {
    return this.setValue(NODE_POST_ID, v);
  }
  get type() {
    return this.values.get(NODE_TYPE);
  }
  set type(v) {
    return this.setValue(NODE_TYPE, v);
  }
  get content() {
    return this.values.get(NODE_CONTENT) || '';
  }
  set content(v) {
    return this.setValue(NODE_CONTENT, v);
  }
  get formatSelections() {
    return this.values.get(NODE_FORMAT_SELECTIONS, new FormatSelections());
  }
  set formatSelections(v) {
    return this.setValue(NODE_FORMAT_SELECTIONS, v);
  }
  get meta() {
    return this.values.get(NODE_META, Map());
  }
  set meta(v) {
    return this.setValue(NODE_META, v);
  }
}

export class DocumentModel extends LinkedList {
  constructor(postId, head, nodes) {
    super(head, nodes, DocumentModelNode);
    this.postId = postId;
    this.headPrev = this.head;
    this.nodesPrev = this.nodes;
  }

  // stores previous head
  headPrev;
  // stores previous nodes Map() to create deltas for history log
  nodesPrev;
  // reference to last insert id because history log entries are "flattened" and lose order
  lastInsertId;

  getNodesBetween(leftNodeId, rightNodeId) {
    const leftNode = this.getNode(leftNodeId);
    const rightNode = this.getNode(rightNodeId);
    if (!leftNode.id || !rightNode.id) {
      console.error(
        'getNodesBetween() - must have valid start and end nodes',
        leftNodeId,
        rightNodeId
      );
      return [];
    }
    const middleNodes = [];
    let nextNode = this.getNext(leftNodeId);
    while (nextNode.id !== rightNodeId) {
      middleNodes.push(nextNode);
      nextNode = this.getNext(nextNode.id);
    }
    return middleNodes;
  }

  isFirstOfType(nodeId) {
    const type = this.getNode(nodeId).type;
    return this.getPrev(nodeId)?.type !== type;
  }

  isLastOfType(nodeId) {
    const type = this.getNode(nodeId).type;
    return this.getNext(nodeId)?.type !== type;
  }

  isTextType(nodeId) {
    return [
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_PRE,
      NODE_TYPE_P,
      NODE_TYPE_LI,
    ].includes(this.getNode(nodeId).type);
  }

  canHaveSelections(nodeId) {
    return [NODE_TYPE_P, NODE_TYPE_LI].includes(this.getNode(nodeId).type);
  }

  isMetaType(nodeId) {
    return [NODE_TYPE_SPACER, NODE_TYPE_QUOTE, NODE_TYPE_IMAGE].includes(
      this.getNode(nodeId).type
    );
  }

  diffNodesAndClearHistory() {
    const nodesThatHaveChanged = [];
    const seenIds = new Set();
    // updates & deletes
    this.nodesPrev.forEach((nodePrev, id) => {
      seenIds.add(id);
      const nodeNew = this.nodes.getNode(id);
      if (!nodePrev.equals(nodeNew)) {
        nodesThatHaveChanged.push(nodeNew || id);
      }
    });
    // inserts
    this.nodes.forEach((nodeNew, id) => {
      if (seenIds.has(id)) {
        return;
      }
      nodesThatHaveChanged.push(nodeNew);
    });
    this.nodesPrev = this.nodes;
    // head change?
    let headNew;
    if (!this.headPrev.equals(this.head)) {
      headNew = this.head;
    }
    this.headPrev = this.head;
    return { head: headNew, nodes: nodesThatHaveChanged };
  }

  update(node) {
    if (!this.getNode(node)) {
      throw new Error('Cant find node');
    }
    if (node.next && !this.getNode(node.next)) {
      throw new Error('Cant find neighbor');
    }
    super.setNode(node);
    return this.diffNodesAndClearHistory();
  }

  insertBefore(data, nodeOrId) {
    if (!this.getNode(nodeOrId)) {
      throw new Error('Bad previous neighbor');
    }
    const newNode = super.insertBefore(
      {
        ...data,
        [NODE_CONTENT]: cleanText(data[NODE_CONTENT]),
        [NODE_POST_ID]: this.postId,
      },
      nodeOrId
    );
    this.lastInsertId = newNode.id;
    return this.diffNodesAndClearHistory();
  }

  insertAfter(data, nodeOrId) {
    if (!this.getNode(nodeOrId)) {
      throw new Error('Bad next neighbor');
    }
    const newNode = super.insertAfter(
      {
        ...data,
        [NODE_CONTENT]: cleanText(data[NODE_CONTENT]),
        [NODE_POST_ID]: this.postId,
      },
      nodeOrId
    );
    this.lastInsertId = newNode.id;
    return this.diffNodesAndClearHistory();
  }

  deleteNode(node) {
    this.remove(node);
    // don't delete last node in document, reset it to an empty title
    if (this.size === 0) {
      this.append({ [NODE_TYPE]: NODE_TYPE_H1, [NODE_CONTENT]: '' });
    }
    return this.diffNodesAndClearHistory();
  }

  // given selectionOffsets - return 2 boolean values for {willDeleteStartNode, willDeleteEndNode}
  willDeleteStartAndEnd({ startNodeId, caretStart, endNodeId, caretEnd }) {
    const willDeleteStartNode =
      this.isMetaType(startNodeId) || (endNodeId && caretStart === 0);
    // NOTE: don't delete node if user selects all text inside of one node only
    //|| (caretStart === 0 &&
    //   caretEnd === this.getNode(startNodeId).get('content', '').length);
    const willDeleteEndNode =
      endNodeId &&
      (this.isMetaType(endNodeId) ||
        caretEnd === this.getNode(endNodeId).content.length);
    return { willDeleteStartNode, willDeleteEndNode };
  }
}
