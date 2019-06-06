import React from 'react';
import { List, Map } from 'immutable';

import {
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_TEXT
} from '../common/constants';

import ContentNode from '../common/content-node.component';

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

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
  timers = {};
  
  ZERO_LENGTH_CHAR = '\u200B';
  
  ENTER_KEY = 13;
  BACKSPACE_KEY = 8;
  UP_ARROW = 38;
  DOWN_ARROW = 40;
  LEFT_ARROW = 37;
  RIGHT_ARROW = 39;
  
  setCaret(nodeId, shouldPlaceAtBeginning = false) {
    const [node] = document.getElementsByName(nodeId);
    if (!node) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    if (shouldPlaceAtBeginning) {
      range.setEndBefore(node);
    } else {
      range.setEndAfter(node);
    }
    range.collapse();
    sel.addRange(range);
  }
  
  getCaretNode() {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0)
    let commonAncestorContainer = range.commonAncestorContainer;
    if (commonAncestorContainer.nodeType > 1) {
      return commonAncestorContainer.parentElement
    }
    if (commonAncestorContainer.dataset.type === NODE_TYPE_SECTION_CONTENT) {
      return commonAncestorContainer.lastChild;
    }
    return commonAncestorContainer;
  }
  
  getMapWithId(obj) {
    obj.id = obj.id || s4();
    return Map(obj);
  }
  
  getNewPost() {
    const { allNodesByParentId } = this.state;
    const root = this.getMapWithId({ type: NODE_TYPE_ROOT });
    const h1 = this.getMapWithId({ type: NODE_TYPE_SECTION_H1 });
    this.setState({
      root,
      allNodesByParentId: allNodesByParentId
        .set(root.get('id'), List([h1]))
    }, () => {
      this.setCaret(h1.get('id'))
    })
  }
  
  
  getParentList(parentId) {
    const {
      allNodesByParentId,
    } = this.state;
    const siblings = allNodesByParentId.get(parentId, null);
    if (!siblings) {
    
    }
  }
  
  commitUpdates(focusElementId) {
    if (!this.history.length) {
      return;
    }
    this.setState({ allNodesByParentId: this.history.pop() }, () => {
      this.setCaret(focusElementId);
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
  
  getNextSibling() {}
  
  getPreviousSibling(nodeId) {
  
  }
  
  cleanText(text) {
    const re = new RegExp(`${this.ZERO_LENGTH_CHAR}`);
    return text.trim().replace(re, '');
  }
  
  handleBackspace = (evt) => {
    if (evt.keyCode !== this.BACKSPACE_KEY) {
      return;
    }
    
    const {
      root,
      allNodesByParentId
    } = this.state;
    
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    if (range.startOffset > 0) {
      return
    }
    evt.stopPropagation();
    evt.preventDefault();
    
    const activeElement = this.getCaretNode();
    const nodeId = activeElement.getAttribute('name');
    const activeType = activeElement.dataset.type;
    const activeParent = activeElement.parentElement;
    const parentId = activeParent.getAttribute('name');
    const parentType = activeParent.dataset.type;
    const siblings = allNodesByParentId
      .get(parentId, List());
    const current = siblings
      .find(node => node.get('id') === nodeId);
    const currentIdx = siblings.indexOf(current);
    
    /**
     * is first child of root (h1) OR is first child of first ContentSection of root?  noop()
     */
    if (parentType === NODE_TYPE_ROOT) {
      return;
    }
    if (parentType === NODE_TYPE_SECTION_CONTENT) {
      const isFirstRootChild = allNodesByParentId.get(root.get('id'))
        .findIndex(node => node.get('id') === parentType) === 0;
      if (isFirstRootChild) {
        return;
      }
    }
    
    /**
     * is first child of Section?
     */
    if (currentIdx === 0) {
      // TODO - merge sections
      return;
    }
    
    if (this.cleanText(activeElement.innerText).length > 0) {
      /**
       * soft ball: merge siblings
       */
    } else {
      /**
       * softer ball: current element is empty, just delete it
       */
      this.updateParentList(parentId, null, currentIdx);
    }
    
    const prevSiblingId = siblings.get(currentIdx - 1).get('id');
    this.commitUpdates(prevSiblingId, false);
  }
  
  handleEnter = async (evt) => {
    if (evt.keyCode !== this.ENTER_KEY) {
      return;
    }
    
    const {
      root,
      allNodesByParentId,
    } = this.state;
    
    evt.stopPropagation();
    evt.preventDefault();
    const activeElement = this.getCaretNode();
    const nodeId = activeElement.getAttribute('name');
    const activeType = activeElement.dataset.type;
    const activeParent = activeElement.parentElement;
    const parentId = activeParent.getAttribute('name');
    const siblings = allNodesByParentId
      .get(parentId, List());
    const current = siblings
      .find(node => node.get('id') === nodeId);
    const currentIdx = siblings.indexOf(current);
    
    /**
     * update current model
     * @type {boolean}
     */
      // TODO: fix this - assume there's only one child and it's a text node
    let shouldClearInnerText = false;
    let textNode = allNodesByParentId
      .get(current.get('id'), List())
      .get(0, null);
    if (textNode) {
      shouldClearInnerText = true;
    } else {
      textNode = this.getMapWithId({ type: NODE_TYPE_TEXT })
    }
    const cleanedText = this.cleanText(activeElement.innerText);
    textNode = textNode.set('content', cleanedText.length > 0 ? cleanedText : this.ZERO_LENGTH_CHAR);
    if (shouldClearInnerText) {
      activeElement.innerText = '';
    }
    this.updateParentList(current.get('id'), textNode);
    
    /**
     * insert a new element, default to P tag
     */
    const p = this.getMapWithId({ type: NODE_TYPE_P });
    if (activeType === NODE_TYPE_P) {
      this.updateParentList(parentId, p, currentIdx + 1);
      this.commitUpdates(p.get('id'), true, true);
      return;
    }
    if (activeType === NODE_TYPE_SECTION_H1) {
      const nextSibling = siblings.get(currentIdx + 1, null);
      if (!nextSibling) {
        // create a ContentSection
        const content = this.getMapWithId({ type: NODE_TYPE_SECTION_CONTENT });
        this.updateParentList(content.get('id'), p, 0);
        this.updateParentList(root.get('id'), content);
      } else {
        // update existing ContentSection
        this.updateParentList(nextSibling.get('id'), p, 0);
      }
      this.commitUpdates(p.get('id'), true, true);
      return;
    }
  }
  
  handleArrows = (evt) => {}
  
  handleKeyDown = evt => {
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  render() {
    const {
      root,
      allNodesByParentId,
    } = this.state;
    
    return !root ? null : (
      <div contentEditable={true} onKeyDown={this.handleKeyDown}>
        <ContentNode node={root} allNodesByParentId={allNodesByParentId} />
      </div>
    );
  }
}

