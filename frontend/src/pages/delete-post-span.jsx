import React from 'react';
import styled from 'styled-components';
import { apiDelete } from '../common/fetch';

import {
  A,
  DeletePost,
} from '../common/layout-styled-components';
import { MetaContent } from '../common/shared-styled-components';
import { userCanDeletePost } from '../common/session';

const DeleteSpan = styled.span`
  ${MetaContent};
  cursor: pointer;
  &:hover {
    font-weight: bolder;
  }
`;
const PostMetaContent = styled.span`
  ${MetaContent};
`;

export default class DeletePostSpan extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      postId: false,
    };
  }
  
  deletePost = async () => {
    const {
      postCanonical,
      postTitle,
      afterDeleteCallback,
    } = this.props;
    if (confirm(`Delete post${postTitle ? ' ' + postTitle : ''}?`)) {
      try {
        await apiDelete(`/post/${postCanonical}`);
        afterDeleteCallback();
      } catch (err) {
        console.error('Delete post error:', err)
      }
    }
  }
  
  async componentDidMount() {
    const {
      postCanonical,
    } = this.props;
    if (!postCanonical) {
      return;
    }
    const postId = await userCanDeletePost(postCanonical);
    this.setState({ postId });
  }
  
  render() {
    const {
      children,
      shouldUseLargeButton,
    } = this.props;
    const { postId } = this.state;
    return postId && (
      shouldUseLargeButton
        ? (<DeletePost onClick={this.deletePost}>{children}</DeletePost>)
        : (
          <React.Fragment>
            <PostMetaContent>|</PostMetaContent>
            <DeleteSpan onClick={this.deletePost}>{children}</DeleteSpan>
          </React.Fragment>
        )
    )
  }
}