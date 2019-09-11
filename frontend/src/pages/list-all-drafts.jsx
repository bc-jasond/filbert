import { fromJS, List } from 'immutable';
import React from 'react';
import { Redirect } from 'react-router-dom';

import {
  apiGet,
  apiPost,
  apiDelete, apiPatch,
} from '../common/fetch';
import { formatPostDate } from '../common/utils';

import {
  StyledH2,
  PostRow,
  PostAbstractRow,
  StyledHeadingA,
  StyledA,
  PostMetaRow,
  PostMetaContent,
  PostMetaContentFirst,
  PostAction,
} from '../common/list-all-styled-components';
import PublishPostForm from './edit/edit-publish-post-form';

export default class AllPosts extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      redirectPostCanonical: null,
      shouldShowPublishPostMenu: false,
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
      drafts: List(),
    }
  }
  
  async componentDidMount() {
    this.loadDrafts();
  }
  
  loadDrafts = async () => {
    const drafts = await apiGet('/draft');
    const postsFormatted = fromJS(drafts.map(draft => {
      draft.published = formatPostDate(draft.published);
      draft.updated = formatPostDate(draft.updated);
      return draft;
    }))
    this.setState({ drafts: postsFormatted })
  }
  
  deleteDraft = async (draft) => {
    if (confirm(`Delete draft ${draft.get('title')}?`)) {
      try {
        await apiDelete(`/draft/${draft.get('id')}`)
        await this.loadDrafts();
      } catch (err) {
        console.error('Delete draft error:', err)
      }
    }
  }
  
  publishDraft = async () => {
    const { shouldShowPublishPostMenu: draft } = this.state;
    if (confirm(`Publish draft ${draft.get('title')}? This makes it public.`)) {
      try {
        await apiPost(`/publish/${draft.get('id')}`)
        // this.setState({redirectPostCanonical: draft.canonical})
        await this.loadDrafts();
        this.setState({
          shouldShowPostSuccess: true,
          shouldShowPostError: null,
        }, () => {
          setTimeout(() => this.setState({ shouldShowPublishPostMenu: false }), 1000);
        });
      } catch (err) {
        console.error('Publish draft error:', err)
      }
    }
  }
  
  updatePost = (fieldName, value) => {
    const { shouldShowPublishPostMenu: draft } = this.state;
    this.setState({
      shouldShowPublishPostMenu: draft.set(fieldName, value),
      shouldShowPostError: null,
      shouldShowPostSuccess: null,
    })
  }
  
  savePost = async () => {
    try {
      const { shouldShowPublishPostMenu: draft } = this.state;
      await apiPatch(`/draft/${draft.get('id')}`, {
        title: draft.get('title'),
        canonical: draft.get('canonical'),
        abstract: draft.get('abstract'),
      });
      await this.loadDrafts();
      this.setState({
        shouldShowPostSuccess: true,
        shouldShowPostError: null,
      }, () => {
        setTimeout(() => this.setState({ shouldShowPostSuccess: null }), 1000);
      })
    } catch (err) {
      this.setState({ shouldShowPostError: true })
    }
  }
  
  openPostMenu = (draft) => {
    this.setState({ shouldShowPublishPostMenu: draft })
  }
  
  closePostMenu = () => {
    this.setState({ shouldShowPublishPostMenu: false })
  }
  
  render() {
    const {
      drafts,
      redirectPostCanonical,
      shouldShowPublishPostMenu,
      shouldShowPostError,
      shouldShowPostSuccess,
    } = this.state;
    
    return redirectPostCanonical
      ? (<Redirect to={`/posts/${redirectPostCanonical}`} />)
      : (
        <React.Fragment>
          {shouldShowPublishPostMenu && (<PublishPostForm
            draft={shouldShowPublishPostMenu}
            updatePost={this.updatePost}
            publishPost={this.publishDraft}
            savePost={this.savePost}
            close={this.closePostMenu}
            successMessage={shouldShowPostSuccess}
            errorMessage={shouldShowPostError}
          />)}
          <PostRow>
            <StyledH2>Recent Drafts</StyledH2>
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
                <PostMetaContentFirst>{draft.get('updated')}</PostMetaContentFirst>
                <PostMetaContent>|</PostMetaContent>
                <PostAction onClick={() => this.openPostMenu(draft)}>publish</PostAction>
                <PostMetaContent>|</PostMetaContent>
                <PostAction onClick={() => this.deleteDraft(draft)}>delete</PostAction>
              </PostMetaRow>
            </PostRow>
          ))}
        </React.Fragment>
      );
  }
}
