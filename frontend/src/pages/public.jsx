import { fromJS, List } from 'immutable';
import React from 'react';
import { Article } from '../common/components/layout-styled-components';
import {
  BaseRow,
  ColFilter,
  Filter,
  FilterInput,
  FilterWithInput,
  PostRow,
  StyledH2,
  StyledH3,
  StyledHeadingA
} from '../common/components/list-all-styled-components';
import { FlexGrid } from '../common/components/shared-styled-components';
import { PAGE_NAME_PUBLIC } from '../common/constants';
import { apiGet } from '../common/fetch';
import { formatPostDate } from '../common/utils';
import Footer from './footer';
import Header from './header';
import PostListRow from '../common/components/post-list-row';

export default class Public extends React.Component {
  usernameInputRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      posts: List(),
      oldestFilterIsSelected: false,
      usernameFilterIsSelected: false,
      username: '',
      randomFilterIsSelected: false,
      loading: false
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

  loadPosts = async () => {
    const {
      state: {
        loading,
        username,
        randomFilterIsSelected: random,
        oldestFilterIsSelected: oldest
      }
    } = this;
    if (loading) {
      return;
    }
    await new Promise(resolve => this.setState({ loading: true }, resolve));
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
    const { error, data: posts } = await apiGet(`/post${queryString}`);
    if (!error) {
      const postsFormatted = fromJS(
        posts.map(post => ({
          ...post,
          published: formatPostDate(post.published),
          updated: formatPostDate(post.updated)
        }))
      );
      this.setState({ posts: postsFormatted });
    }
    this.setState({ loading: false });
  };

  loadPostsDebounce = async () => {
    if (this.checkUsernameTimeout) {
      clearTimeout(this.checkUsernameTimeout);
    }
    this.checkUsernameTimeout = setTimeout(this.loadPosts, 750);
  };

  toggleOldestFilter = () => {
    const {
      state: { oldestFilterIsSelected, loading }
    } = this;
    if (loading) {
      return;
    }
    this.setState(
      { oldestFilterIsSelected: !oldestFilterIsSelected },
      this.loadPosts
    );
  };

  toggleRandomFilter = () => {
    const {
      state: { randomFilterIsSelected, loading }
    } = this;
    if (loading) {
      return;
    }
    this.setState(
      { randomFilterIsSelected: !randomFilterIsSelected },
      this.loadPosts
    );
  };

  toggleUsernameFilter = () => {
    const {
      state: { usernameFilterIsSelected, loading }
    } = this;
    if (loading) {
      return;
    }
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
      state: { username, loading }
    } = this;
    if (loading) {
      return;
    }
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
        loading,
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
        <Header
          session={session}
          setSession={setSession}
          pageName={PAGE_NAME_PUBLIC}
        />
        <Article>
          <>
            <BaseRow>
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
            </BaseRow>
            <BaseRow loading={loading ? 1 : undefined}>
              <StyledH3>Filter by:</StyledH3>
              <FlexGrid>
                <ColFilter>
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
                </ColFilter>
                <ColFilter>
                  <FilterWithInput
                    isOpen={usernameFilterIsSelected}
                    onClick={this.toggleUsernameFilter}
                  >
                    username @
                  </FilterWithInput>
                  <FilterInput
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
                </ColFilter>
              </FlexGrid>
            </BaseRow>
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
              <PostListRow key={post.get('canonical')} post={post} />
            ))}
          </>
        </Article>
        <Footer />
      </>
    );
  }
}
