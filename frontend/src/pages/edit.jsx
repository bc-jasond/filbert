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
  
  getNewPost() {
    const root = new BlogPostNode({type: NODE_TYPE_ROOT});
    const h1 = new BlogPostNode({type: NODE_TYPE_SECTION_H1}, root);
    const text = new BlogPostNode({type: NODE_TYPE_TEXT}, h1);
    h1.childNodes.push(text);
    root.childNodes.push(h1);
    this.setState({root})
  }
  
  async componentDidMount() {
    this.getNewPost();
  }
  
  ENTER_KEY = 13;
  
  handleKeyDown = evt => {
    const { root } = this.state;
    if (evt.keyCode === this.ENTER_KEY) {
      evt.stopPropagation();
      evt.preventDefault();
      const sel = window.getSelection();
      const range = sel.getRangeAt(0)
      const activeElement = range.endContainer.parentElement;
      const nodeId = activeElement.getAttribute('name');
      const content = activeElement.innerHTML;
      const activeType = activeElement.dataset.type;
      const activeParent = activeElement.parentElement;
      const parentId = activeParent.getAttribute('name');
      if (activeType === NODE_TYPE_P) {
        const parent = root.findById(parentId)
        const p = new BlogPostNode({type: NODE_TYPE_P});
        parent.childNodes.push(p);
        this.setState({root},() => {
          const [newP] = document.getElementsByName(p.id);
          range.setEnd(newP, 0);
          range.collapse();
          sel.removeAllRanges();
          sel.addRange(range);
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
          range.setEnd(newP, 0);
          range.collapse();
          sel.removeAllRanges();
          sel.addRange(range);
        })
      }
      console.log(this.childNodes, document.activeElement.innerHTML);
    }
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
