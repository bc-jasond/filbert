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
  PostAction,
  AuthorExpand,
  PostActionA,
} from '../common/list-all-styled-components';

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
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
    
    return posts.size > 0 && (
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
              {post.get('canEdit') && (
                <React.Fragment>
                  <PostMetaContent>|</PostMetaContent>
                  <PostActionA href={`/edit/${postId}`}>edit</PostActionA>
                </React.Fragment>
              )}
              {post.get('canDelete') && (
                <React.Fragment>
                  <PostMetaContent>|</PostMetaContent>
                  <PostAction>delete</PostAction>
                </React.Fragment>
              )}
              <PostMetaContent>|</PostMetaContent>
              <AuthorExpand>{post.get('username')}</AuthorExpand>
            </PostMetaRow>
          </PostRow>
        ))}
      </React.Fragment>
    );
  }
}
