import { fromJS, List } from 'immutable';
import React from 'react';
import { FlexGrid, Col } from '../common/components/shared-styled-components';

import { apiGet } from '../common/fetch';
import { formatPostDate } from '../common/utils';

import Header from './header';
import Footer from './footer';
import { Article } from '../common/components/layout-styled-components';
import {
  ColFilter,
  Filter,
  FilterInput,
  FilterWithInput,
  PostAbstractRow,
  PostActionLink,
  PostMetaContentFirst,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledH2,
  StyledH3,
  StyledHeadingA
} from '../common/components/list-all-styled-components';

export default class AllPosts extends React.Component {
  containsInputRef = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      drafts: List(),
      oldestFilterIsSelected: false,
      containsFilterIsSelected: false,
      contains: '',
      randomFilterIsSelected: false,
      loading: false
    };
  }

  async componentDidMount() {
    this.syncQueryParamsAndLoadDrafts();
  }

  async componentDidUpdate() {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.toString() !== this.prevQueryParams.toString()) {
      this.syncQueryParamsAndLoadDrafts();
    }
  }

  syncQueryParamsAndLoadDrafts = async () => {
    const queryParams = new URLSearchParams(window.location.search);
    this.prevQueryParams = queryParams;
    this.setState(
      {
        oldestFilterIsSelected: queryParams.has('oldest'),
        containsFilterIsSelected: queryParams.has('contains'),
        contains: queryParams.get('contains') || '',
        randomFilterIsSelected: queryParams.has('random')
      },
      this.loadDrafts
    );
  };

  loadDrafts = async () => {
    const {
      state: {
        loading,
        contains,
        randomFilterIsSelected: random,
        oldestFilterIsSelected: oldest
      }
    } = this;
    if (loading) {
      return;
    }
    await new Promise(resolve => this.setState({ loading: true }, resolve));
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.delete('contains');
    queryParams.delete('random');
    queryParams.delete('oldest');
    if (contains) {
      queryParams.set('contains', contains);
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
    const { error, data: drafts } = await apiGet(`/draft${queryString}`);
    if (!error) {
      const postsFormatted = fromJS(
        drafts.map(draft => ({
          ...draft,
          updated: formatPostDate(draft.updated)
        }))
      );
      this.setState({ drafts: postsFormatted });
    }
    this.setState({ loading: false });
  };

  loadDraftsDebounce = async () => {
    if (this.containsTimeout) {
      clearTimeout(this.containsTimeout);
    }
    this.containsTimeout = setTimeout(this.loadDrafts, 750);
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
      this.loadDrafts
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
      this.loadDrafts
    );
  };

  toggleContainsFilter = () => {
    const {
      state: { containsFilterIsSelected, loading }
    } = this;
    if (loading) {
      return;
    }
    this.setState(
      {
        containsFilterIsSelected: !containsFilterIsSelected,
        contains: ''
      },
      () => {
        if (!containsFilterIsSelected) {
          this.containsInputRef.current.focus();
        } else {
          this.loadDrafts();
        }
      }
    );
  };

  updateContains = event => {
    const {
      target: { value }
    } = event;
    const {
      state: { contains, loading }
    } = this;
    if (loading) {
      return;
    }
    this.setState({ contains: value }, () => {
      if (value === contains || value.length < 3) {
        return;
      }
      this.loadDraftsDebounce();
    });
  };

  render() {
    const {
      state: {
        loading,
        drafts,
        oldestFilterIsSelected,
        containsFilterIsSelected,
        contains,
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
              <StyledH2>My Private Work</StyledH2>
              <StyledH3>
                These pieces have{' '}
                <span role="img" aria-label="lock">
                  🔒
                </span>{' '}
                NOT been published{' '}
                <span role="img" aria-label="lock">
                  🔑
                </span>{' '}
                and are only viewable
                <span role="img" aria-label="eyeballs">
                  👀
                </span>{' '}
                by you while logged into{' '}
                <span role="img" aria-label="hand writing with a pen">
                  ✍️
                </span>{' '}
                filbert
              </StyledH3>
            </PostRow>
            <PostRow loading={loading ? 1 : undefined}>
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
                    isOpen={containsFilterIsSelected}
                    onClick={this.toggleContainsFilter}
                  >
                    contains:
                  </FilterWithInput>
                  <FilterInput
                    ref={this.containsInputRef}
                    shouldHide={!containsFilterIsSelected}
                    name="post-text"
                    type="text"
                    value={contains}
                    onChange={this.updateContains}
                    autoComplete="off"
                  />
                </ColFilter>
              </FlexGrid>
            </PostRow>
            {drafts.size === 0 && (
              <PostRow>
                <StyledHeadingA href="/edit/new">
                  <span role="img" aria-label="magnifying glass">
                    🔍
                  </span>{' '}
                  Clear Filters or Click Here or the &quot;new&quot; menu button
                  above to start a new Private piece
                </StyledHeadingA>
              </PostRow>
            )}
            {drafts.map(draft => (
              <PostRow key={`${draft.get('id')}${draft.get('canonical')}`}>
                <StyledHeadingA href={`/edit/${draft.get('id')}`}>
                  {draft.get('title')}
                </StyledHeadingA>
                <PostAbstractRow>
                  <StyledA href={`/edit/${draft.get('id')}`}>
                    {draft.get('abstract')}
                  </StyledA>
                </PostAbstractRow>
                <PostMetaRow>
                  <PostMetaContentFirst>
                    {draft.get('updated')}
                  </PostMetaContentFirst>
                  <PostActionLink to={`/post-details/${draft.get('id')}`}>
                    details
                  </PostActionLink>
                  <PostActionLink to={`/edit/${draft.get('id')}`}>
                    edit
                  </PostActionLink>
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
