import { fromJS, List } from 'immutable';
import React, { useEffect, useState } from 'react';
import { FlexGrid } from '../common/components/shared-styled-components';
import { PAGE_NAME_PRIVATE, PAGE_NAME_PUBLIC } from '../common/constants';

import { apiGet } from '../common/fetch';
import { formatPostDate } from '../common/utils';

import Header from './header';
import Footer from './footer';
import {
  Article,
  StyledHeadingA,
} from '../common/components/layout-styled-components';
import {
  BaseRow,
  ColFilter,
  Filter,
  FilterInput,
  FilterWithInput,
  StyledH2,
  StyledH3,
} from '../common/components/list-all-styled-components';

import PostListRow from '../common/components/post-list-row';

export default React.memo(
  ({ shouldListDrafts = false, session, setSession }) => {
    const getPostsUrl = shouldListDrafts ? '/draft' : '/post';

    const inputRef = React.createRef();

    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [loading, setLoading] = useState(false);
    const [posts, setDrafts] = useState(List());

    let queryParams = new URLSearchParams(window.location.search);
    const [oldestFilterIsSelected, setOldestFilterIsSelected] = useState(
      queryParams.has('oldest')
    );
    // for Drafts - post "contains" text
    const [containsFilterIsSelected, setContainsFilterIsSelected] = useState(
      queryParams.has('contains')
    );
    const [contains, setContains] = useState(queryParams.get('contains') || '');
    // for Posts - username is like...
    const [usernameFilterIsSelected, setUsernameFilterIsSelected] = useState(
      queryParams.has('username')
    );
    const [username, setUsername] = useState(queryParams.get('username') || '');
    // I thought this would be fun, not implemented yet
    const [randomFilterIsSelected, setRandomFilterIsSelected] = useState(
      queryParams.has('random')
    );

    function syncQueryStringWithStateAndPushHistory() {
      queryParams = new URLSearchParams(window.location.search);
      queryParams.delete('username');
      queryParams.delete('contains');
      queryParams.delete('random');
      queryParams.delete('oldest');
      if (!shouldListDrafts && username) {
        queryParams.set('username', username);
      }
      if (shouldListDrafts && contains) {
        queryParams.set('contains', contains);
      }
      if (randomFilterIsSelected) {
        queryParams.set('random', '');
      }
      if (oldestFilterIsSelected) {
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
    }

    async function loadPosts() {
      if (loading) {
        return;
      }
      setLoading(true);
      queryParams = new URLSearchParams(window.location.search);
      const queryString =
        queryParams.toString().length > 0 ? `?${queryParams.toString()}` : '';

      const { error, data: postsData } = await apiGet(
        `${getPostsUrl}${queryString}`
      );
      if (!error) {
        const postsFormatted = fromJS(
          postsData.map((post) => ({
            ...post,
            published: formatPostDate(post.published),
            updated: formatPostDate(post.updated),
          }))
        );
        setDrafts(postsFormatted);
      }
      setLoading(false);
    }

    useEffect(() => {
      syncQueryStringWithStateAndPushHistory();
      loadPosts();
    }, [
      oldestFilterIsSelected,
      containsFilterIsSelected,
      randomFilterIsSelected,
      shouldListDrafts,
    ]);
    useEffect(() => {
      syncQueryStringWithStateAndPushHistory();
    }, [contains, username]);

    function toggleOldestFilter() {
      if (loading) {
        return;
      }
      setOldestFilterIsSelected(!oldestFilterIsSelected);
    }

    function toggleRandomFilter() {
      if (loading) {
        return;
      }
      setRandomFilterIsSelected(!randomFilterIsSelected);
    }

    function toggleContainsFilter() {
      if (loading) {
        return;
      }
      setContainsFilterIsSelected(!containsFilterIsSelected);
      setContains('');
      if (!containsFilterIsSelected) {
        inputRef.current.focus();
      }
    }

    function updateContains({ target: { value } }) {
      if (loading) {
        return;
      }
      setContains(value);
      if (value === contains || value.length < 3) {
        return;
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      setDebounceTimeout(setTimeout(loadPosts, 750));
    }

    function toggleUsernameFilter() {
      if (loading) {
        return;
      }
      setUsernameFilterIsSelected(!usernameFilterIsSelected);
      setUsername('');

      if (!usernameFilterIsSelected) {
        inputRef.current.focus();
      }
    }

    function updateUsername({ target: { value } }) {
      if (loading) {
        return;
      }
      const newUsername = value.replace(/[^0-9a-z]/g, '');
      setUsername(newUsername);
      if (
        newUsername === username ||
        newUsername.length < 5 ||
        newUsername.length > 42
      ) {
        return;
      }
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      setDebounceTimeout(setTimeout(loadPosts, 750));
    }

    return (
      <>
        <Header
          session={session}
          setSession={setSession}
          pageName={shouldListDrafts ? PAGE_NAME_PRIVATE : PAGE_NAME_PUBLIC}
        />
        <Article>
          <>
            <BaseRow>
              <StyledH2>
                {shouldListDrafts ? 'My Private Work' : 'Public Articles'}
              </StyledH2>
              <StyledH3>
                {shouldListDrafts ? (
                  <>
                    These pieces have{' '}
                    <span role="img" aria-label="lock">
                      🔒
                    </span>{' '}
                    NOT been published{' '}
                    <span role="img" aria-label="lock">
                      🔑
                    </span>{' '}
                    and are only viewable{' '}
                    <span role="img" aria-label="eyeballs">
                      👀
                    </span>{' '}
                    by you while logged into{' '}
                    <span role="img" aria-label="hand writing with a pen">
                      ✍️
                    </span>{' '}
                    filbert
                  </>
                ) : (
                  <>
                    These pieces have been published{' '}
                    <span role="img" aria-label="stack of books">
                      📚
                    </span>{' '}
                    and are viewable by everyone on the World Wide Web{' '}
                    <span role="img" aria-label="globe">
                      🌍
                    </span>
                  </>
                )}
              </StyledH3>
            </BaseRow>
            <BaseRow loading={loading ? 1 : undefined}>
              <StyledH3>Filter by:</StyledH3>
              <FlexGrid>
                <ColFilter>
                  <Filter
                    isOpen={!oldestFilterIsSelected}
                    onClick={toggleOldestFilter}
                  >
                    newest ⇩
                  </Filter>
                  <Filter
                    isOpen={oldestFilterIsSelected}
                    onClick={toggleOldestFilter}
                  >
                    oldest ⇧
                  </Filter>
                  <Filter
                    isOpen={randomFilterIsSelected}
                    onClick={toggleRandomFilter}
                  >
                    random ?
                  </Filter>
                </ColFilter>
                {shouldListDrafts ? (
                  <ColFilter>
                    <FilterWithInput
                      isOpen={containsFilterIsSelected}
                      onClick={toggleContainsFilter}
                    >
                      contains:
                    </FilterWithInput>
                    <FilterInput
                      ref={inputRef}
                      shouldHide={!containsFilterIsSelected}
                      name="post-text"
                      type="text"
                      value={contains}
                      onChange={updateContains}
                      autoComplete="off"
                    />
                  </ColFilter>
                ) : (
                  <ColFilter>
                    <FilterWithInput
                      isOpen={usernameFilterIsSelected}
                      onClick={toggleUsernameFilter}
                    >
                      username @
                    </FilterWithInput>
                    <FilterInput
                      ref={inputRef}
                      shouldHide={!usernameFilterIsSelected}
                      name="username"
                      type="text"
                      value={username}
                      onChange={updateUsername}
                      autoComplete="off"
                      minLength="5"
                      maxLength="42"
                    />
                  </ColFilter>
                )}
              </FlexGrid>
            </BaseRow>
            {posts.size === 0 && (
              <BaseRow>
                {shouldListDrafts ? (
                  <StyledHeadingA href="/edit/new">
                    <span role="img" aria-label="magnifying glass">
                      🔍
                    </span>{' '}
                    Clear Filters or Click Here or the &quot;new&quot; menu
                    button above to start a new Private piece
                  </StyledHeadingA>
                ) : (
                  <StyledHeadingA>
                    <span role="img" aria-label="crying face">
                      😢
                    </span>{' '}
                    Nada. 没有. Rien. ничего. Nothing. ナッシング...
                  </StyledHeadingA>
                )}
              </BaseRow>
            )}
            {posts.map((post) => (
              <PostListRow
                key={post.get('id')}
                post={post}
                postIsPrivate={shouldListDrafts}
              />
            ))}
          </>
        </Article>
        <Footer />
      </>
    );
  }
);
