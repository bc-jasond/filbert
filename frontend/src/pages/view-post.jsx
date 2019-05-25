import React from 'react';

import Page404 from './404';
import Loading from './loading';

import { getContentTree, BlogPost } from '../common/blog-content.model';

export default class ViewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      pageContent: null,
      loading: true,
      shouldShow404: false,
    }
  }
  
  async componentDidMount() {
    try {
      const response = await fetch(`http://localhost:3001/post/${this.props.postId}`);
      const { post, contentNodes } = await response.json();
      this.setState({ pageContent: getContentTree(contentNodes), loading: false, shouldShow404: false })
    } catch (err) {
      console.log(err);
      this.setState({ pageContent: null, loading: false, shouldShow404: true })
    }
  }
  
  render() {
    const {
      pageContent,
      loading,
      shouldShow404,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    if (loading) return (<Loading />);
    
    return (
      <React.Fragment>
        {pageContent.render()}
      </React.Fragment>
    );
  }
}
