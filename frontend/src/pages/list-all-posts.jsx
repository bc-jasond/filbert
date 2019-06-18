import React from 'react';
import styled from 'styled-components';
import { sansSerif } from '../common/fonts.css';
import { grey, darkGrey } from '../common/css';

import { apiGet, apiDelete } from '../common/fetch';
import { formatPostDate } from '../common/utils';

import {
  H2
} from '../common/shared-styled-components';
import {
  A,
} from '../common/layout-styled-components';

const StyledH2 = styled(H2)`
  margin-left: 0;
  margin-right: 0;
`;
const PostRow = styled.div`
  margin: 0 auto;
  max-width: 768px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  word-break: break-word;
  &:last-of-type {
    border: none;
    margin-bottom: 40px;
  }
  @media (max-width: 768px) {
    margin: 0;
  }
`;
const PostAbstractRow = styled.div`
  margin-top: 4px;
`;
const StyledHeadingA = styled(A)`
  max-height: 56px;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 28px;
  font-weight: 600;
`;
const StyledA = styled(A)`
  max-height: 48px;
  font-size: 18.96px;
  line-height: 24px;
  color: ${grey};
  letter-spacing: 0px;
`;
const PostMetaRow = styled.div`
  display: flex;
  align-items: flex-end;
  margin-top: 8px;
`;
const PostMetaContent = styled.span`
  color: ${grey};
  letter-spacing: 0px;
  font-size: 15.8px;
  line-height: 20px;
  font-style: normal;
  font-family: ${sansSerif};
  padding-left: 4px;
  &:first-of-type {
    padding-left: 0;
  }
`;
const AuthorExpand = styled(PostMetaContent)`
  transition: letter-spacing 0.125s, color 0.125s;
  &:hover {
    letter-spacing: 8px;
    color: ${darkGrey};
    cursor: pointer;
  }
`;
const DeletePost = styled(PostMetaContent)`
  cursor: pointer;
  font-weight: bolder;
`;

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      posts: [],
    }
  }
  
  async componentDidMount() {
    this.loadPosts();
  }
  
  async loadPosts() {
    const { draftsOnly } = this.props;
    const posts = await apiGet(draftsOnly ? '/draft' : '/post');
    const postsFormatted = posts.map(post => {
      post.published = formatPostDate(post.published);
      post.updated = formatPostDate(post.updated);
      return post;
    })
    this.setState({ posts: postsFormatted })
  }
  
  deleteDraft = async (post) => {
    if (confirm(`Delete draft ${post.title}?`)) {
      try {
        await apiDelete(`/draft/${post.id}`)
        await this.loadPosts();
      } catch (err) {
        console.error('Delete draft error:', err)
      }
    }
  }
  
  render() {
    const { posts } = this.state;
    const { draftsOnly } = this.props;
    
    return (
      <React.Fragment>
        <PostRow>
          <StyledH2>{`Recent ${draftsOnly ? 'Drafts' : 'Articles'}`}</StyledH2>
        </PostRow>
        {posts.map(post => (
          <PostRow key={`${post.id}${post.canonical}`}>
            <StyledHeadingA href={draftsOnly ? `/edit/${post.id}` : `/posts/${post.canonical}`}>
              {post.title}
            </StyledHeadingA>
            <PostAbstractRow>
              <StyledA href={draftsOnly ? `/edit/${post.id}` : `/posts/${post.canonical}`}>
                {post.abstract}
              </StyledA>
            </PostAbstractRow>
            <PostMetaRow>
              <PostMetaContent>{draftsOnly ? post.updated : post.published}</PostMetaContent>
              <PostMetaContent>|</PostMetaContent>
              {draftsOnly ? (<DeletePost onClick={() => this.deleteDraft(post)}>X</DeletePost>) : (<AuthorExpand>{post.username}</AuthorExpand>)}
            </PostMetaRow>
          </PostRow>
        ))}
      </React.Fragment>
    );
  }
}