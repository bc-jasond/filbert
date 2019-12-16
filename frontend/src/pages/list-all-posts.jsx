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

export default class AllPosts extends React.Component {
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
      posts.map(post => {
        post.published = formatPostDate(post.published);
        post.updated = formatPostDate(post.updated);
        return post;
      })
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
    const { posts } = this.state;

    return (
      <>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">✍️ filbert</LogoLinkStyled>
            <HeaderLinksContainer>
              {getSession() ? (
                <>
                  <NewPost to="/edit/new">new</NewPost>
                  <ListDrafts to="/drafts">drafts</ListDrafts>
                  <SignedInUser
                    onClick={() => {
                      if (confirm('Logout?')) {
                        signout();
                        // TODO: do something with state/props here
                        window.location.reload();
                      }
                    }}
                  >
                    {getUserName()}
                  </SignedInUser>
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
                  <StyledHeadingA href={`/posts/${post.get('canonical')}`}>
                    {post.get('title')}
                  </StyledHeadingA>
                  <PostAbstractRow>
                    <StyledA href={`/posts/${post.get('canonical')}`}>
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
