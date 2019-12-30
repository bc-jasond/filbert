import { fromJS, List } from 'immutable';
import React from 'react';

import { apiDelete, apiGet } from '../common/fetch';
import { getSession, getUserName, signout } from '../common/session';
import { confirmPromise, formatPostDate } from '../common/utils';

import Footer from './footer';
import {
  Article,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LinkStyledSignIn,
  ListDrafts,
  LogoLinkStyled,
  NewPost,
  SignedInUser
} from '../common/components/layout-styled-components';
import {
  AuthorExpand,
  PostAbstractRow,
  PostAction,
  PostActionA,
  PostMetaContentFirst,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledH2,
  StyledHeadingA
} from '../common/components/list-all-styled-components';

export default class Discover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      posts: List()
    };
  }

  async componentDidMount() {
    this.loadPosts();
  }

  loadPosts = async () => {
    const posts = await apiGet('/post');
    const postsFormatted = fromJS(
      posts.map(post => ({
        ...post,
        published: formatPostDate(post.published),
        updated: formatPostDate(post.updated)
      }))
    );
    this.setState({ posts: postsFormatted });
  };

  deletePost = async post => {
    try {
      await confirmPromise(`Delete post ${post.get('title')}?`);
      await apiDelete(`/post/${post.get('id')}`);
      this.loadPosts();
    } catch (err) {
      console.error('Delete post error:', err);
    }
  };

  render() {
    const {
      state: { posts }
    } = this;

    return (
      <>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">
              <span role="img" aria-label="hand writing with a pen">
                ✍️
              </span>{' '}
              filbert
            </LogoLinkStyled>
            <HeaderLinksContainer>
              {getSession() ? (
                <>
                  <NewPost to="/edit/new">new</NewPost>
                  <ListDrafts to="/private">private</ListDrafts>
                  <SignedInUser to="/me">{getUserName()}</SignedInUser>
                </>
              ) : (
                <LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>
              )}
            </HeaderLinksContainer>
          </HeaderContentContainer>
        </Header>
        <HeaderSpacer />
        <Article>
          {posts.size > 0 && (
            <>
              <PostRow>
                <StyledH2>Recent Articles</StyledH2>
              </PostRow>
              {posts.map(post => (
                <PostRow key={`${post.get('id')}${post.get('canonical')}`}>
                  <StyledHeadingA href={`/p/${post.get('canonical')}`}>
                    {post.get('title')}
                  </StyledHeadingA>
                  <PostAbstractRow>
                    <StyledA href={`/p/${post.get('canonical')}`}>
                      {post.get('abstract')}
                    </StyledA>
                  </PostAbstractRow>
                  <PostMetaRow>
                    <PostMetaContentFirst>
                      {post.get('published')}
                    </PostMetaContentFirst>
                    {post.get('canEdit') && (
                      <>
                        <PostActionA href={`/edit/${post.get('id')}`}>
                          edit
                        </PostActionA>
                      </>
                    )}
                    {post.get('canDelete') && (
                      <>
                        <PostAction onClick={() => this.deletePost(post)}>
                          delete
                        </PostAction>
                      </>
                    )}
                    <AuthorExpand>{post.get('username')}</AuthorExpand>
                  </PostMetaRow>
                </PostRow>
              ))}
            </>
          )}
        </Article>
        <Footer />
      </>
    );
  }
}
