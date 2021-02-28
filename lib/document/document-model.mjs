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

export class DocumentModelNode extends LinkedListNode {
  constructor(data = {}) {
    super(data);
    if (data.formatSelections) {
      this.formatSelections = new FormatSelections(data.formatSelections.head, data.formatSelections.nodes)
    }
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
  isTextType() {
    return [
      NODE_TYPE_H1,
      NODE_TYPE_H2,
      NODE_TYPE_PRE,
      NODE_TYPE_P,
      NODE_TYPE_LI,
    ].includes(this.type);
  }

  canHaveSelections() {
    return [NODE_TYPE_P, NODE_TYPE_LI].includes(this.type);
  }

  isMetaType() {
    return [NODE_TYPE_SPACER, NODE_TYPE_QUOTE, NODE_TYPE_IMAGE].includes(
      this.type
    );
  }
  get isHeading() {
    return this.type === NODE_TYPE_H1;
  }
  get isSubHeading() {
    return this.type === NODE_TYPE_H2;
  }
  get isParagraph() {
    return this.type === NODE_TYPE_P;
  }
  get isListItem() {
    return this.type === NODE_TYPE_LI;
  }
  get isCode() {
    return this.type === NODE_TYPE_PRE;
  }
  get isSpacer() {
    return this.type === NODE_TYPE_SPACER;
  }
  get isQuote() {
    return this.type === NODE_TYPE_QUOTE;
  }
  get isImage() {
    return this.type === NODE_TYPE_IMAGE;
  }
}

export class DocumentModel extends LinkedList {
  constructor(postId = -1, head, nodes) {
    super(head, nodes, DocumentModelNode);
    this.postId = postId;
  }

  // stores previous head
  headChangedId = this.head?.id;
  // stores previous nodes Map() to create deltas for history log
  nodesChanged = Map();
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

  // build history log entry
  getPendingHistoryLogEntry() {
    let nodesThatHaveChanged = Map();
    this.nodesChanged.forEach((updatedNodeOrId) => {
      const id =
        typeof updatedNodeOrId === 'string'
          ? updatedNodeOrId
          : updatedNodeOrId.id;
      nodesThatHaveChanged = nodesThatHaveChanged.set(id, updatedNodeOrId);
    });
    this.nodesChanged = Map();
    // head change?
    let headNew;
    if (this.headChangedId !== this.head.id) {
      headNew = this.getNode(this.head.id);
      this.headChangedId = this.head.id;
    }
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
    // log of changes
    // only this one node changed
    this.nodesChanged = this.nodesChanged.set(node.id, node);
    return this.getPendingHistoryLogEntry();
  }

  insertBefore(data, nodeOrId) {
    if (!this.getNode(nodeOrId)) {
      throw new Error('Bad previous neighbor');
    }
    const prevNode = this.getPrev(nodeOrId);
    const newNode = super.insertBefore(
      {
        ...data,
        [NODE_CONTENT]: cleanText(data[NODE_CONTENT]),
      },
      nodeOrId
    );
    // log of changes
    // the newly inserted node changed
    this.nodesChanged = this.nodesChanged.set(newNode.id, newNode);
    // next pointer of the previous node to nodeOrId changed, if nodeOrId wasn't the head
    if (prevNode) {
      this.nodesChanged = this.nodesChanged.set(prevNode.id, prevNode);
      // break reference - get updated copy!
      this.update(this.getNode(prevNode));
    }
    this.lastInsertId = newNode.id;
    return this.getPendingHistoryLogEntry();
  }

  insertAfter(data, nodeOrId) {
    const afterNode = this.getNode(nodeOrId);
    if (!afterNode) {
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
    // log of changes
    // newly inserted node
    this.nodesChanged = this.nodesChanged.set(newNode.id, newNode);
    // next pointer of nodeOrId changed
    this.nodesChanged = this.nodesChanged.set(afterNode.id, afterNode);
    // break reference - get fresh data!
    this.update(this.getNode(afterNode));
    this.lastInsertId = newNode.id;
    return this.getPendingHistoryLogEntry();
  }

  deleteNode(node) {
    const prevNode = this.getPrev(node);
    this.remove(node);
    // log of changes
    // node that was deleted
    this.nodesChanged = this.nodesChanged.set(node.id, node.id);
    // next pointer of prev node, if node wasn't the head
    if (prevNode) {
      this.nodesChanged = this.nodesChanged.set(prevNode.id, prevNode);
    }
    // don't delete last node in document, reset it to an empty title
    if (this.size === 0) {
      const placeholderTitle = this.append({
        [NODE_TYPE]: NODE_TYPE_H1,
        [NODE_CONTENT]: '',
      });
      this.nodesChanged = this.nodesChanged.set(
        placeholderTitle.id,
        placeholderTitle
      );
    }
    return this.getPendingHistoryLogEntry();
  }

  // given selectionOffsets - return 2 boolean values for {willDeleteStartNode, willDeleteEndNode}
  willDeleteStartAndEnd({ startNodeId, caretStart, endNodeId, caretEnd }) {
    const startNode = this.getNode(startNodeId);
    const endNode = this.getNode(endNodeId);
    const willDeleteStartNode =
      startNode?.isMetaType() || (endNodeId && caretStart === 0);
    // NOTE: don't delete node if user selects all text inside of one node only
    //|| (caretStart === 0 &&
    //   caretEnd === this.getNode(startNodeId).get('content', '').length);
    const willDeleteEndNode =
      endNode && (endNode.isMetaType() || caretEnd === endNode.content.length);
    return { willDeleteStartNode, willDeleteEndNode };
  }

  static fromJSON(postId, json) {
    const { head: headData, nodes: nodesObj = {} } = JSON.parse(json);
    const head = new DocumentModelNode(headData);
    const nodes = Map(nodesObj).map(
      (nodeRaw) => new DocumentModelNode(nodeRaw)
    );
    return new DocumentModel(postId, nodes.get(head.id), nodes);
  }
  static fromJS(postId, headArg, nodesArg) {
    const head = new DocumentModelNode(headArg);
    const nodes = Map(nodesArg).map(
      (nodeRaw) => new DocumentModelNode(nodeRaw)
    );
    return new DocumentModel(postId, nodes.get(head.id), nodes);
  }
}
