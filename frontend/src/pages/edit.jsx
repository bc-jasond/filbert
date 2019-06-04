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
  
  setCaret(nodeId) {
    const [node] = document.getElementsByName(nodeId);
    if (!node) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.setEnd(node, 0);
    range.collapse();
    sel.addRange(range);
  }
  
  getCaretNode() {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0)
    return range.endContainer.parentElement;
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
  
  handleBackspace = (evt) => {
    if (evt.keyCode === this.BACKSPACE_KEY) {
      const sel = window.getSelection();
      const range = sel.getRangeAt(0);
      if (range.startOffset === 0) {
        // TODO: allow contenteditable to delete the current tag
        evt.stopPropagation();
        evt.preventDefault();
      }
    }
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
  
  handleEnter = async (evt) => {
    const {
      root,
      allNodesByParentId,
    } = this.state;
    if (evt.keyCode === this.ENTER_KEY) {
      evt.stopPropagation();
      evt.preventDefault();
      const activeElement = this.getCaretNode();
      const nodeId = activeElement.getAttribute('name');
      const activeType = activeElement.dataset.type;
      const activeParent = activeElement.parentElement;
      const parentId = activeParent.getAttribute('name');
      
      /**
       * update model from DOM
       */
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
      textNode = textNode.set('content', activeElement.innerText);
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
        this.commitUpdates(p.get('id'));
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
        this.commitUpdates(p.get('id'));
        return;
      }
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

