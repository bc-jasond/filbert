import { fromJS, List } from 'immutable';
import React from 'react';

import {
  apiGet,
} from '../common/fetch';
import { formatPostDate } from '../common/utils';

import {
  StyledH2,
  PostRow,
  PostAbstractRow,
  StyledHeadingA,
  StyledA,
  PostMetaRow,
  PostMetaContent,
  PostMetaContentFirst,
} from '../common/list-all-styled-components';
import DeletePostSpan from './delete-post-span';
import EditPostButton from './edit-post-button';

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      redirectPostCanonical: null,
      shouldShowPublishPostMenu: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
      posts: List(),
    }
  }
  
  async componentDidMount() {
    this.loadPosts();
  }
  
  loadPosts = async () => {
    const posts = await apiGet('/post');
    const postsFormatted = fromJS(posts.map(post => {
      post.published = formatPostDate(post.published);
      post.updated = formatPostDate(post.updated);
      return post;
    }))
    this.setState({ posts: postsFormatted })
  }
  
  render() {
    const {
      posts,
    } = this.state;
    
    return (
      <React.Fragment>
        <PostRow>
          <StyledH2>Recent Articles</StyledH2>
        </PostRow>
        {posts.map(post => (
          <PostRow key={`${post.get('id')}${post.get('canonical')}`}>
            <StyledHeadingA href={`/posts/${post.get('canonical')}`}>
              {post.get('title')}
            </StyledHeadingA>
            <PostAbstractRow>
              <StyledA href={`/posts/${post.get('canonical')}`}>
                {post.get('abstract')}
              </StyledA>
            </PostAbstractRow>
            <PostMetaRow>
              <PostMetaContentFirst>{post.get('published')}</PostMetaContentFirst>
              {/*TODO: Ajax calls in a loop - yay!  This can be optimized after features are complete*/}
              <EditPostButton postCanonical={post.get('canonical')}>edit</EditPostButton>
              <DeletePostSpan
                postCanonical={post.get('canonical')}
                postTitle={post.get('title')}
                afterDeleteCallback={this.loadPosts}
              >
                delete
              </DeletePostSpan>
              <PostMetaContent>|</PostMetaContent>
              <AuthorExpand>{post.get('username')}</AuthorExpand>
            </PostMetaRow>
          </PostRow>
        ))}
      </React.Fragment>
    );
  }
}
