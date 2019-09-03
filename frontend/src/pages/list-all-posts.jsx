import React from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { grey, darkGrey } from '../common/css';

import {
  apiGet,
  apiPost,
  apiDelete,
} from '../common/fetch';
import { formatPostDate } from '../common/utils';

import {
  H2,
  MetaContent,
} from '../common/shared-styled-components';
import {
  A,
} from '../common/layout-styled-components';
import DeletePostSpan from './delete-post-span';
import EditPostButton from './edit-post-button';

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
  ${MetaContent};
`;
const PostMetaContentFirst = styled.span`
  ${MetaContent};
  padding-left: 0;
`;
const AuthorExpand = styled.span`
  ${MetaContent};
  transition: letter-spacing 0.125s, color 0.125s;
  &:hover {
    letter-spacing: 8px;
    color: ${darkGrey};
    cursor: pointer;
  }
`;
const PostAction = styled.span`
  ${MetaContent};
  cursor: pointer;
  &:hover {
    font-weight: bolder;
  }
`;

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      redirectPostCanonical: null,
      posts: [],
    }
  }
  
  async componentDidMount() {
    this.loadPosts();
  }
  
  loadPosts = async () => {
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
  
  publishDraft = async (post) => {
    if (confirm(`Publish draft ${post.title}?`)) {
      try {
        await apiPost(`/publish/${post.id}`)
        this.setState({redirectPostCanonical: post.canonical})
        await this.loadPosts();
      } catch (err) {
        console.error('Publish draft error:', err)
      }
    }
  }
  
  render() {
    const {
      posts,
      redirectPostCanonical,
    } = this.state;
    const { draftsOnly } = this.props;
    
    return redirectPostCanonical
      ? (<Redirect to={`/posts/${redirectPostCanonical}`} />)
      : (
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
                <PostMetaContentFirst>{draftsOnly ? post.updated : post.published}</PostMetaContentFirst>
                {draftsOnly ? (
                  <React.Fragment>
                    <PostMetaContent>|</PostMetaContent>
                    <PostAction onClick={() => this.publishDraft(post)}>publish</PostAction>
                    <PostMetaContent>|</PostMetaContent>
                    <PostAction onClick={() => this.deleteDraft(post)}>delete</PostAction>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    {/*TODO: Ajax calls in a loop - yay!  This will be optimized when a server rendered solution is in place like Next.js*/}
                    <EditPostButton postCanonical={post.canonical}>edit</EditPostButton>
                    <DeletePostSpan
                      postCanonical={post.canonical}
                      postTitle={post.title}
                      afterDeleteCallback={this.loadPosts}
                    >
                      delete
                    </DeletePostSpan>
                    <PostMetaContent>|</PostMetaContent>
                    <AuthorExpand>{post.username}</AuthorExpand>
                  </React.Fragment>
                )}
              </PostMetaRow>
            </PostRow>
          ))}
        </React.Fragment>
      );
  }
}
