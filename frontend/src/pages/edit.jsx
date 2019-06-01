import React from 'react';
import {
  NODE_TYPE_P,
  NODE_TYPE_ROOT,
  NODE_TYPE_SECTION_CONTENT,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_TEXT
} from '../common/constants';

import { BlogPostNode } from '../common/blog-content.model';

export default class EditPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      root: null,
    }
  }
  
  setCaret(node) {
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
  
  getNewPost() {
    const root = new BlogPostNode({type: NODE_TYPE_ROOT});
    const h1 = new BlogPostNode({type: NODE_TYPE_SECTION_H1}, root);
    const text = new BlogPostNode({type: NODE_TYPE_TEXT}, h1);
    h1.childNodes.push(text);
    root.childNodes.push(h1);
    this.setState({root}, () => {
      const [h1Node] = document.getElementsByName(h1.id);
      this.setCaret(h1Node)
    })
  }
  
  async componentDidMount() {
    this.getNewPost();
  }
  
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
  
  handleEnter = (evt) => {
    const { root } = this.state;
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
      const current = root.findById(nodeId);
      const currentText = current.getTextNode();
      currentText.content = activeElement.innerText;
      // unset current innerText to avoid double-render
      activeElement.innerText = '';
      
      /**
       * insert a new element, default to P tag
       */
      if (activeType === NODE_TYPE_P) {
        const parent = root.findById(parentId)
        const p = new BlogPostNode({type: NODE_TYPE_P});
        parent.childNodes.push(p);
        this.setState({root},() => {
          const [newP] = document.getElementsByName(p.id);
          this.setCaret(newP)
        });
      }
      if (activeType === NODE_TYPE_SECTION_H1) {
        // create a ContentSection
        const content = new BlogPostNode({type: NODE_TYPE_SECTION_CONTENT}, this.parent);
        const p = new BlogPostNode({type: NODE_TYPE_P}, content);
        content.childNodes.push(p);
        root.childNodes.push(content);
        this.setState({root}, () => {
          const [newP] = document.getElementsByName(p.id);
          this.setCaret(newP)
        })
      }
    }
  }
  
  handleArrows = (evt) => {}
  
  handleKeyDown = evt => {
    console.log(evt.keyCode);
    
    this.handleBackspace(evt);
    this.handleEnter(evt);
  }
  
  render() {
    const {
      root,
    } = this.state;
    
    return !root ? null : (
      <div id="edit-container" contentEditable={true} onKeyDown={this.handleKeyDown}>
        {root.render()}
      </div>
    );
  }
}
