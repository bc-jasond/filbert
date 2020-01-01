import { fromJS, List } from 'immutable';
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  Article,
  NavSpan
} from '../common/components/layout-styled-components';
import {
  authorExpandMixin,
  MetaContent,
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
import { Input } from '../common/components/shared-styled-components';
import { lightBlue } from '../common/css';

import { apiDelete, apiGet } from '../common/fetch';
import { confirmPromise, formatPostDate } from '../common/utils';
import Footer from './footer';

import Header from './header';

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-around;
`;
const Filter = styled(NavSpan)`
  padding: 9px;
  margin: 8px;
`;
const UsernameFilter = styled(Filter)`
  border: 1px solid transparent;
  border-right: none;
  margin-right: 0;
  ${p =>
    p.isOpen &&
    `
    border: 1px solid ${lightBlue};
    border-right: none;
    margin-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  `}
`;
const InputStyled = styled(Input)`
  height: 36px;
  margin-right: 8px;
  transition: opacity 0.2s;
  opacity: 1;
  //outline: 0; // outline is ugly but, a11y
  border: 1px solid ${lightBlue};
  border-left: none;
  border-radius: 0 26px 26px 0;
  ${p =>
    p.shouldHide &&
    `
    opacity: 0;
  `}
`;
const AuthorExpand = styled(Link)`
  ${MetaContent};
  padding-left: 9px;
  ${authorExpandMixin};
`;

export default class Public extends React.Component {
  usernameInputRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      posts: List(),
      oldestFilterIsSelected: false,
      usernameFilterIsSelected: false,
      username: '',
      randomFilterIsSelected: false
    };
  }

  async componentDidMount() {
    this.syncQueryParamsAndLoadPosts();
  }

  async componentDidUpdate() {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.toString() !== this.prevQueryParams.toString()) {
      this.syncQueryParamsAndLoadPosts();
    }
  }

  syncQueryParamsAndLoadPosts = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    this.prevQueryParams = queryParams;
    this.setState(
      {
        oldestFilterIsSelected: queryParams.has('oldest'),
        usernameFilterIsSelected: queryParams.has('username'),
        username: queryParams.get('username') || '',
        randomFilterIsSelected: queryParams.has('random')
      },
      this.loadPosts
    );
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

  loadPosts = async () => {
    const {
      state: {
        username,
        randomFilterIsSelected: random,
        oldestFilterIsSelected: oldest
      }
    } = this;
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete('username');
    queryParams.delete('random');
    queryParams.delete('oldest');
    if (username) {
      queryParams.set('username', username);
    }
    if (random) {
      queryParams.set('random', '');
    }
    if (oldest) {
      queryParams.set('oldest', '');
    }
    const queryString =
      queryParams.toString().length > 0 ? `?${queryParams.toString()}` : '';
    // update the URL in history for the user to retain
    window.history.pushState(
      {},
      document.title,
      `${window.location.pathname}${queryString}`
    );
    const posts = await apiGet(`/post${queryString}`);
    const postsFormatted = fromJS(
      posts.map(post => ({
        ...post,
        published: formatPostDate(post.published),
        updated: formatPostDate(post.updated)
      }))
    );
    this.setState({ posts: postsFormatted });
  };

  loadPostsDebounce = async () => {
    if (this.checkUsernameTimeout) {
      clearTimeout(this.checkUsernameTimeout);
    }
    this.checkUsernameTimeout = setTimeout(this.loadPosts, 500);
  };

  toggleOldestFilter = () => {
    const {
      state: { oldestFilterIsSelected }
    } = this;
    this.setState(
      { oldestFilterIsSelected: !oldestFilterIsSelected },
      this.loadPosts
    );
  };

  toggleRandomFilter = () => {
    const {
      state: { randomFilterIsSelected }
    } = this;
    this.setState(
      { randomFilterIsSelected: !randomFilterIsSelected },
      this.loadPosts
    );
  };

  toggleUsernameFilter = () => {
    const {
      state: { usernameFilterIsSelected }
    } = this;
    this.setState(
      {
        usernameFilterIsSelected: !usernameFilterIsSelected,
        username: ''
      },
      () => {
        if (!usernameFilterIsSelected) {
          this.usernameInputRef.current.focus();
        } else {
          this.loadPosts();
        }
      }
    );
  };

  updateUsername = event => {
    const {
      target: { value }
    } = event;
    const {
      state: { username }
    } = this;
    const newUsername = value.replace(/[^0-9a-z]/g, '');
    this.setState({ username: newUsername }, () => {
      if (
        newUsername === username ||
        newUsername.length < 5 ||
        newUsername.length > 42
      ) {
        return;
      }
      this.loadPostsDebounce();
    });
  };

  render() {
    const {
      state: {
        posts,
        oldestFilterIsSelected,
        usernameFilterIsSelected,
        username,
        randomFilterIsSelected
      },
      props: { session, setSession }
    } = this;

    return (
      <>
        <Header session={session} setSession={setSession} />
        <Article>
          <>
            <PostRow>
              <StyledH2>Public Articles</StyledH2>
              <StyledH3>
                These pieces have been published{' '}
                <span role="img" aria-label="stack of books">
                  📚
                </span>{' '}
                and are viewable by everyone on the World Wide Web{' '}
                <span role="img" aria-label="globe">
                  🌍
                </span>
              </StyledH3>
            </PostRow>
            <PostRow>
              <StyledH3>Filter by:</StyledH3>
              <FilterContainer>
                <Filter
                  isOpen={!oldestFilterIsSelected}
                  onClick={this.toggleOldestFilter}
                >
                  newest ⇩
                </Filter>
                <Filter
                  isOpen={oldestFilterIsSelected}
                  onClick={this.toggleOldestFilter}
                >
                  oldest ⇧
                </Filter>
                <Filter
                  isOpen={randomFilterIsSelected}
                  onClick={this.toggleRandomFilter}
                >
                  random ?
                </Filter>
                <div>
                  <UsernameFilter
                    isOpen={usernameFilterIsSelected}
                    onClick={this.toggleUsernameFilter}
                  >
                    username @
                  </UsernameFilter>
                  <InputStyled
                    ref={this.usernameInputRef}
                    shouldHide={!usernameFilterIsSelected}
                    name="username"
                    type="text"
                    value={username}
                    onChange={this.updateUsername}
                    autoComplete="off"
                    minLength="5"
                    maxLength="42"
                  />
                </div>
              </FilterContainer>
            </PostRow>
            {posts.size === 0 && (
              <PostRow>
                <StyledHeadingA>
                  <span role="img" aria-label="crying face">
                    😢
                  </span>{' '}
                  Nada. 没有. Rien. ничего. Nothing. ナッシング...
                </StyledHeadingA>
              </PostRow>
            )}
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
                  <AuthorExpand to={`/public?username=${post.get('username')}`}>
                    {post.get('username')}
                  </AuthorExpand>
                </PostMetaRow>
              </PostRow>
            ))}
          </>
        </Article>
        <Footer />
      </>
    );
  }
}
