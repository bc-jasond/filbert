import React from 'react';
import { apiGet } from '../common/fetch';

import Page404 from './404';

import { getContentTree, BlogPost } from '../common/blog-content.model';

export default class ViewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      pageContent: null,
      shouldShow404: false,
    }
  }
  
  async componentDidMount() {
    try {
      const { post, contentNodes } = await apiGet(`/post/${this.props.postId}`);
      this.setState({ pageContent: getContentTree(contentNodes), shouldShow404: false })
    } catch (err) {
      console.log(err);
      this.setState({ pageContent: null, shouldShow404: true })
    }
  }
  
  render() {
    const {
      pageContent,
      shouldShow404,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    
    return !pageContent ? null : (
      <React.Fragment>
        {pageContent.render()}
      </React.Fragment>
    );
  }
}
