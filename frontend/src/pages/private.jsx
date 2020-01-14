import { fromJS, List } from 'immutable';
import React from 'react';

import { apiDelete, apiGet, apiPatch, apiPost } from '../common/fetch';
import { formatPostDate } from '../common/utils';

import Header from './header';
import Footer from './footer';
import { Article } from '../common/components/layout-styled-components';
import {
  FilterContainer,
  Filter,
  FilterWithInput,
  FilterInput,
  PostAbstractRow,
  PostAction,
  PostMetaContentFirst,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledH2,
  StyledH3,
  StyledHeadingA
} from '../common/components/list-all-styled-components';
import PublishPostForm from '../common/components/edit-publish-post-form';

export default class AllPosts extends React.Component {
  containsInputRef = React.createRef();
  constructor(props) {
    super(props);

    this.state = {
      shouldShowPublishPostMenu: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
      drafts: List(),
      oldestFilterIsSelected: false,
      containsFilterIsSelected: false,
      contains: '',
      randomFilterIsSelected: false
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
        contains,
        randomFilterIsSelected: random,
        oldestFilterIsSelected: oldest
      }
    } = this;
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
    const drafts = await apiGet(`/draft${queryString}`);
    const postsFormatted = fromJS(
      drafts.map(draft => ({
        ...draft,
        updated: formatPostDate(draft.updated)
      }))
    );
    this.setState({ drafts: postsFormatted });
  };

  deleteDraft = async draft => {
    if (confirm(`Delete draft ${draft.get('title')}?`)) {
      try {
        await apiDelete(`/draft/${draft.get('id')}`);
        await this.loadDrafts();
      } catch (err) {
        console.error('Delete draft error:', err);
      }
    }
  };

  publishDraft = async () => {
    const {
      state: { shouldShowPublishPostMenu: draft }
    } = this;
    if (confirm(`Publish draft ${draft.get('title')}? This makes it public.`)) {
      try {
        await apiPost(`/publish/${draft.get('id')}`);
        await this.loadDrafts();
        this.setState(
          {
            shouldShowPostSuccess: true,
            shouldShowPostError: null
          },
          () => {
            setTimeout(
              () => this.setState({ shouldShowPublishPostMenu: false }),
              1000
            );
          }
        );
      } catch (err) {
        console.error('Publish draft error:', err);
      }
    }
  };

  updatePost = (fieldName, value) => {
    const {
      state: { shouldShowPublishPostMenu: draft }
    } = this;
    this.setState({
      shouldShowPublishPostMenu: draft.set(fieldName, value),
      shouldShowPostError: null,
      shouldShowPostSuccess: null
    });
  };

  savePost = async () => {
    try {
      const {
        state: { shouldShowPublishPostMenu: draft }
      } = this;
      await apiPatch(`/post/${draft.get('id')}`, {
        title: draft.get('title'),
        canonical: draft.get('canonical'),
        abstract: draft.get('abstract')
      });
      await this.loadDrafts();
      this.setState(
        {
          shouldShowPostSuccess: true,
          shouldShowPostError: null
        },
        () => {
          setTimeout(
            () => this.setState({ shouldShowPostSuccess: null }),
            1000
          );
        }
      );
    } catch (err) {
      this.setState({ shouldShowPostError: true });
    }
  };

  openPostMenu = draft => {
    this.setState({ shouldShowPublishPostMenu: draft });
  };

  closePostMenu = () => {
    this.setState({ shouldShowPublishPostMenu: false });
  };
  
  loadDraftsDebounce = async () => {
    if (this.containsTimeout) {
      clearTimeout(this.containsTimeout);
    }
    this.containsTimeout = setTimeout(this.loadDrafts, 500);
  };
  
  toggleOldestFilter = () => {
    const {
      state: { oldestFilterIsSelected }
    } = this;
    this.setState(
      { oldestFilterIsSelected: !oldestFilterIsSelected },
      this.loadDrafts
    );
  };
  
  toggleRandomFilter = () => {
    const {
      state: { randomFilterIsSelected }
    } = this;
    this.setState(
      { randomFilterIsSelected: !randomFilterIsSelected },
      this.loadDrafts
    );
  };
  
  toggleContainsFilter = () => {
    const {
      state: { containsFilterIsSelected }
    } = this;
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
      state: { contains }
    } = this;
    this.setState({ contains: value }, () => {
      if (
        value === contains ||
        value.length < 3
      ) {
        return;
      }
      this.loadDraftsDebounce();
    });
  };

  render() {
    const {
      state: {
        drafts,
        shouldShowPublishPostMenu,
        shouldShowPostError,
        shouldShowPostSuccess,
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
            {shouldShowPublishPostMenu && (
              <PublishPostForm
                post={shouldShowPublishPostMenu}
                updatePost={this.updatePost}
                publishPost={this.publishDraft}
                savePost={this.savePost}
                close={this.closePostMenu}
                successMessage={shouldShowPostSuccess}
                errorMessage={shouldShowPostError}
              />
            )}
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
                </div>
              </FilterContainer>
            </PostRow>
            {drafts.size === 0 && (
              <PostRow>
                <StyledHeadingA href="/edit/new">
                  <span role="img" aria-label="magnifying glass">🔍</span>{' '}Clear Filters or Click Here or the &quot;new&quot; menu button above to start a
                  new Private piece
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
                  <PostAction onClick={() => this.openPostMenu(draft)}>
                    publish
                  </PostAction>
                  <PostAction onClick={() => this.deleteDraft(draft)}>
                    delete
                  </PostAction>
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
