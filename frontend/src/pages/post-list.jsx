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
import useDebounce from '../common/use-debounce.hook';

export default React.memo(
  ({ shouldListDrafts = false, session, setSession }) => {
    const getPostsUrl = shouldListDrafts ? '/draft' : '/post';

    const inputRef = React.createRef();
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState(List());

    const queryParams = new URLSearchParams(window.location.search);
    const [oldestFilterIsSelected, setOldestFilterIsSelected] = useState(
      queryParams.has('oldest')
    );
    // for Drafts - post "contains" text
    const [containsFilterIsSelected, setContainsFilterIsSelected] = useState(
      queryParams.has('contains')
    );
    const [contains, setContains] = useState(queryParams.get('contains') || '');
    const containsDebounced = useDebounce(contains, 750);

    // for Posts - username is like...
    const [usernameFilterIsSelected, setUsernameFilterIsSelected] = useState(
      queryParams.has('username')
    );
    const [username, setUsername] = useState(queryParams.get('username') || '');
    const usernameDebounced = useDebounce(username, 750);

    // I thought this would be fun, not implemented yet
    const [randomFilterIsSelected, setRandomFilterIsSelected] = useState(
      queryParams.has('random')
    );
    const [queryString, setQueryString] = useState(queryParams.toString());

    function pushHistory(params) {
      const queryStringInternal =
        params.toString().length > 0 ? `?${params.toString()}` : '';
      // update the URL in history for the user to retain
      window.history.pushState(
        {},
        document.title,
        `${window.location.pathname}${queryStringInternal}`
      );
    }

    useEffect(() => {
      const queryParamsInternal = new URLSearchParams(window.location.search);
      queryParamsInternal.delete('random');
      queryParamsInternal.delete('oldest');
      if (!containsFilterIsSelected) {
        queryParamsInternal.delete('contains');
      }
      if (!usernameFilterIsSelected) {
        queryParamsInternal.delete('username');
      }
      if (randomFilterIsSelected) {
        queryParamsInternal.set('random', '');
      }
      if (oldestFilterIsSelected) {
        queryParamsInternal.set('oldest', '');
      }
      pushHistory(queryParamsInternal);
      setQueryString(queryParamsInternal.toString());
    }, [
      oldestFilterIsSelected,
      randomFilterIsSelected,
      containsFilterIsSelected,
      usernameFilterIsSelected,
      shouldListDrafts,
    ]);

    useEffect(() => {
      if (!shouldListDrafts) {
        return;
      }
      const queryParamsInternal = new URLSearchParams(window.location.search);
      queryParamsInternal.delete('contains');
      if (containsDebounced.length < 3) {
        return;
      }
      queryParamsInternal.set('contains', containsDebounced);
      pushHistory(queryParamsInternal);
      setQueryString(queryParamsInternal.toString());
    }, [containsDebounced, shouldListDrafts]);

    useEffect(() => {
      if (shouldListDrafts) {
        return;
      }
      const queryParamsInternal = new URLSearchParams(window.location.search);
      queryParamsInternal.delete('username');
      if (usernameDebounced.length < 5 || usernameDebounced.length > 42) {
        return;
      }
      queryParamsInternal.set('username', usernameDebounced);
      pushHistory(queryParamsInternal);
      setQueryString(queryParamsInternal.toString());
    }, [usernameDebounced, shouldListDrafts]);

    useEffect(() => {
      async function loadPosts(queryStringArg = '') {
        setLoading(true);
        const queryStringInternal =
          queryStringArg.length > 0 ? `?${queryStringArg}` : '';
        const { error, data: postsData } = await apiGet(
          `${getPostsUrl}${queryStringInternal}`
        );
        if (!error) {
          const postsFormatted = fromJS(
            postsData.map((post) => ({
              ...post,
              published: formatPostDate(post.published),
              updated: formatPostDate(post.updated),
            }))
          );
          setPosts(postsFormatted);
        }
        setLoading(false);
      }
      loadPosts(queryString);
    }, [queryString, getPostsUrl]);

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
