import React from 'react';
import { apiPost } from '../common/fetch';

import {
  PublishPost,
} from '../common/layout-styled-components';
import { userCanPublishPost } from '../common/session';

export default class DeletePostSpan extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      postId: false,
    };
  }
  
  publishPost = async () => {
    const {
      postId,
      postTitle,
      afterPublishCallback,
    } = this.props;
    if (confirm(`Publish post${postTitle ? ' ' + postTitle : ''}?`)) {
      try {
        await apiPost(`/publish/${postId}`);
        afterPublishCallback();
      } catch (err) {
        console.error('Publish post error:', err)
      }
    }
  }
  
  async componentDidMount() {
    const {
      postId,
    } = this.props;
    if (!postId) {
      return;
    }
    const id = await userCanPublishPost(postId);
    this.setState({ postId: id });
  }
  
  render() {
    const {
      children,
    } = this.props;
    const { postId } = this.state;
    return postId && (<PublishPost onClick={this.publishPost}>{children}</PublishPost>)
  }
}