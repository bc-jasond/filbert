import { fromJS, List } from 'immutable';
import React from 'react';

import { apiDelete, apiGet, apiPatch, apiPost } from '../common/fetch';
import { formatPostDate } from '../common/utils';

import Header from './header';
import Footer from './footer';
import { Article } from '../common/components/layout-styled-components';
import {
  PostAbstractRow,
  PostAction,
  PostMetaContentFirst,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledH2, StyledH3,
  StyledHeadingA
} from '../common/components/list-all-styled-components';
import PublishPostForm from '../common/components/edit-publish-post-form';

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      shouldShowPublishPostMenu: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
      drafts: List()
    };
  }

  async componentDidMount() {
    this.loadDrafts();
  }

  loadDrafts = async () => {
    const drafts = await apiGet('/draft');
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

  render() {
    const {
      state: {
        drafts,
        shouldShowPublishPostMenu,
        shouldShowPostError,
        shouldShowPostSuccess
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
                <StyledH3>These pieces have NOT been published and are only viewable to you while logged into ✍️ filbert</StyledH3>
              </PostRow>
              {drafts.size === 0 && (<PostRow><StyledHeadingA href="/edit/new">Click Here or the "new" menu button above to start a new Private piece</StyledHeadingA></PostRow>)}
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
