import React from 'react';
import { NODE_TYPE_ROOT, NODE_TYPE_SECTION_H1, NODE_TYPE_TEXT } from '../common/constants';

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
  
  render() {
    const {
      root,
    } = this.state;
    
    return !root ? null : (
      <React.Fragment>
        {root.render()}
      </React.Fragment>
    );
  }
}
