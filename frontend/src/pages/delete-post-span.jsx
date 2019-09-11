import React from 'react';
import styled from 'styled-components';
import { apiDelete } from '../common/fetch';

import {
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
      postId,
      postCanonical,
      postTitle,
      afterDeleteCallback,
    } = this.props;
    if (confirm(`Delete post${postTitle ? ' ' + postTitle : ''}?`)) {
      try {
        // postId is a number when coming from the Edit & Drafts page
        if (Number.isInteger(parseInt(postId,10))) {
          await apiDelete(`/draft/${postId}`);
        } else {
          // postCanonical is used when deleting from the View & List pages
          await apiDelete(`/post/${postCanonical}`);
        }
        afterDeleteCallback();
      } catch (err) {
        console.error('Delete post error:', err)
      }
    }
  }
  
  async componentDidMount() {
    const {
      postCanonical,
      postId,
    } = this.props;
    if (!(postCanonical || postId)) {
      return;
    }
    const id = await userCanDeletePost(postCanonical ? postCanonical : postId);
    this.setState({ postId: id });
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