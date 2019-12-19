import { fromJS, List } from 'immutable';
import React from 'react';

import { apiDelete, apiGet, apiPatch, apiPost } from '../common/fetch';
import { getSession, getUserName, signout } from '../common/session';
import { formatPostDate } from '../common/utils';

import Footer from './footer';
import {
  Article,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LinkStyledSignIn,
  LogoLinkStyled,
  NewPost,
  SignedInUser
} from '../common/components/layout-styled-components';
import {
  PostAbstractRow,
  PostAction,
  PostMetaContentFirst,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledH2,
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
      }
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
                  <SignedInUser
                    onClick={() => {
                      if (confirm('Logout?')) {
                        signout();
                        // TODO: do something with state/props here?
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
          {drafts.size > 0 && (
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
                <StyledH2>My Recent Drafts</StyledH2>
              </PostRow>
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
          )}
        </Article>
        <Footer />
      </>
    );
  }
}
