import React from 'react';
import { List, Map } from 'immutable';

import {
  getMapWithId,
  cleanText,
} from '../common/utils';

import {
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_TEXT,
  ENTER_KEY,
  BACKSPACE_KEY,
} from '../common/constants';

import ContentNode from '../common/content-node.component';

export default class EditPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      allNodesByParentId: Map(),
      root: null,
    }
  }
  
  async componentDidMount() {
    this.getNewPost();
  }
  
  history = [];
  timers = {}; // TODO: add a debounced save timer per element
  
  setCaret(nodeId, shouldPlaceAtBeginning = false) {
    const [containerNode] = document.getElementsByName(nodeId);
    if (!containerNode) return;
    // has a text node?
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    if (shouldPlaceAtBeginning) {
      range.setEnd(containerNode, 0);
    } else {
      // find text node, if present
      const textNode = Array.prototype.reduce.call(
        containerNode.childNodes,
        (acc, child) => acc || (child.nodeType === 3 ? child : null),
        null
      );
      if (textNode) {
        // set caret to end of text content
        range.setEnd(textNode, textNode.textContent.length);
      } else {
        // set caret to last child - TODO: make recursive to find text node?
        range.setEnd(containerNode, containerNode.childNodes.length - 1);
      }
    }
    range.collapse();
    sel.addRange(range);
  }
  
  getCaretNode() {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0)
    let { commonAncestorContainer } = range;
    if (commonAncestorContainer.nodeType > 1) {
      return commonAncestorContainer.parentElement
    }
    if (commonAncestorContainer.dataset.type === NODE_TYPE_SECTION_CONTENT) {
      return commonAncestorContainer.lastChild;
    }
    return commonAncestorContainer;
  }
  
  getNewPost() {
    const { allNodesByParentId } = this.state;
    const root = getMapWithId({ type: NODE_TYPE_ROOT });
    const h1 = getMapWithId({ type: NODE_TYPE_SECTION_H1 });
    this.setState({
      root,
      allNodesByParentId: allNodesByParentId
        .set(root.get('id'), List([h1]))
    }, () => {
      this.setCaret(h1.get('id'), true)
    })
  }
  
  commitUpdates(focusElementId, placeCaretAtBeginning = false) {
    if (!this.history.length) {
      return;
    }
    this.setState({ allNodesByParentId: this.history.pop() }, () => {
      this.setCaret(focusElementId, placeCaretAtBeginning);
      this.history = [];
    })
  }
  
  updateParentList(parentId, node = null, idx = -1) {
    const allNodesByParentId = this.history.pop() || this.state.allNodesByParentId;
    const children = allNodesByParentId.get(parentId, List());
    if (node === null && idx === -1) {
      throw new Error('updateParentList - must provide either a node or an index');
    }
    if (node === null) {
      // delete a node at idx
      // TODO: is this the last child of `parentId` ?  Then remove parent from it's parent list
      this.history.push(allNodesByParentId.set(parentId, children.delete(idx)))
      return;
    }
    if (idx === -1) {
      // push to end of list
      this.history.push(allNodesByParentId.set(parentId, children.push(node)))
      return
    }
    this.history.push(allNodesByParentId.set(parentId, children.insert(idx, node)));
  }
  
  activeElementHasContent() {
    return cleanText(this.activeElement.textContent).length > 0;
  }
  
  /**
   * update/sync current model and DOM
   */
  updateActiveElement() {
    const { allNodesByParentId } = this.state;
    // TODO: fix this - assuming that there's only one child and it's a text node
    const textNode = allNodesByParentId
        .get(this.current.get('id'), List([getMapWithId({ type: NODE_TYPE_TEXT })]))
        .first();
    this.updateParentList(this.current.get('id'), textNode.set('content', cleanText(this.activeElement.textContent)));
    // if there was existing content, clear the DOM to avoid duplication
    if (textNode.get('content', '').length > 0) {
      this.activeElement.textContent = '';
    }
  }
  
  resetDomAndModelReferences() {
    const { allNodesByParentId } = this.state;
    /**
     * DOM refs
     */
    this.activeElement = this.getCaretNode();
    this.nodeId = this.activeElement.getAttribute('name');
    this.activeType = this.activeElement.dataset.type;
    this.activeParent = this.activeElement.parentElement;
    this.parentId = this.activeParent.getAttribute('name');
    this.parentType = this.activeParent.dataset.type;
    /**
     * MODEL refs
     */
    this.siblings = allNodesByParentId
      .get(this.parentId, List());
    this.current = this.siblings
      .find(node => node.get('id') === this.nodeId);
    this.currentIdx = this.siblings.indexOf(this.current);
    this.prevSibling = this.siblings.get(this.currentIdx - 1);
  }
  
  handleBackspace = (evt) => {
    if (evt.keyCode !== BACKSPACE_KEY) {
      return;
    }
    
    const {
      root,
      allNodesByParentId
    } = this.state;
  
    this.resetDomAndModelReferences();
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
  
    if (range.startOffset > 0 && this.activeElementHasContent()) {
      // not at beginning of node text and node text isn't empty - don't override, it's just a normal backspace
      return
    }
    evt.stopPropagation();
    evt.preventDefault();
  
    if (!this.activeElementHasContent()) {
      // current element (P tag) is 'empty', just remove it
      this.updateParentList(this.parentId, null, this.currentIdx);
      this.commitUpdates(this.prevSibling.get('id'));
      return;
    }
    
    /**
     * first child of root (h1)? OR first child of first ContentSection of root? -> noop()
     */
    if (this.parentType === NODE_TYPE_ROOT) {
      return;
    }
    if (this.parentType === NODE_TYPE_SECTION_CONTENT) {
      const isFirstRootChild = allNodesByParentId.get(root.get('id'))
        .findIndex(node => node.get('id') === this.parentType) === 0;
      if (isFirstRootChild) {
        return;
      }
    }
    
    /**
     * first child of Section?
     */
    if (this.currentIdx === 0) {
      // TODO - merge sections
      return;
    }
  
    /**
     * merge sibling (P tags only so far)
     */
    if (this.activeElementHasContent()) {
      const prevSiblingLastChild = allNodesByParentId
        .get(this.prevSibling.get('id'))
        .last();
      const currentFirstChild = allNodesByParentId
        .get(this.current.get('id'), List([Map({ type: NODE_TYPE_TEXT, content: this.activeElement.textContent })]))
        .first();
      // merged text node
      const mergedSiblingLastChild = prevSiblingLastChild.set('content', cleanText(`${prevSiblingLastChild.get('content')}${currentFirstChild.get('content')}`));
      // remove original text node
      this.updateParentList(this.prevSibling.get('id'), null, 0);
      // add merged text node to P tag
      this.updateParentList(this.prevSibling.get('id'), mergedSiblingLastChild);
      // remove 'deleted' P tag
      this.updateParentList(this.parentId, null, this.currentIdx);
      this.commitUpdates(this.prevSibling.get('id'));
    }
  }
  
  handleEnter = async (evt) => {
    if (evt.keyCode !== ENTER_KEY) {
      return;
    }
    
    const {
      root,
    } = this.state;
    
    evt.stopPropagation();
    evt.preventDefault();
    
    this.resetDomAndModelReferences();
    
    this.updateActiveElement();
    
    /**
     * insert a new element, default to P tag
     */
    const p = getMapWithId({ type: NODE_TYPE_P });
    if (this.activeType === NODE_TYPE_P) {
      this.updateParentList(this.parentId, p, this.currentIdx + 1);
      this.commitUpdates(p.get('id'));
      return;
    }
    if (this.activeType === NODE_TYPE_SECTION_H1) {
      const nextSibling = this.siblings.get(this.currentIdx + 1, null);
      if (!nextSibling) {
        // create a ContentSection
        const content = getMapWithId({ type: NODE_TYPE_SECTION_CONTENT });
        this.updateParentList(content.get('id'), p, 0);
        this.updateParentList(root.get('id'), content);
      } else {
        // update existing ContentSection
        this.updateParentList(nextSibling.get('id'), p, 0);
      }
      this.commitUpdates(p.get('id'));
      return;
    }
  }
  
  handleChange = evt => {
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  render() {
    const {
      root,
      allNodesByParentId,
    } = this.state;
    
    return !root ? null : (
      <div onKeyDown={this.handleChange} contentEditable={true}>
        <ContentNode node={root} allNodesByParentId={allNodesByParentId} />
      </div>
    );
  }
}

