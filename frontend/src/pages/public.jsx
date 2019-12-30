import { fromJS, List } from 'immutable';
import React from 'react';

import { apiDelete, apiGet } from '../common/fetch';
import { confirmPromise, formatPostDate } from '../common/utils';

import Header from './header';
import Footer from './footer';
import { Article } from '../common/components/layout-styled-components';
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
  StyledH3,
  StyledHeadingA
} from '../common/components/list-all-styled-components';

export default class Public extends React.Component {
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
      state: { posts },
      props: { session, setSession }
    } = this;

    return (
      <>
        <Header session={session} setSession={setSession} />
        <Article>
          {posts.size > 0 && (
            <>
              <PostRow>
                <StyledH2>Recent Public Articles</StyledH2>
                <StyledH3>These pieces have been published and are viewable outside of ✍️ filbert</StyledH3>
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
