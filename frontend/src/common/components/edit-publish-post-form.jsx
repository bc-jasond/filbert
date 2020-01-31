import React from 'react';
import { Redirect } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { POST_ACTION_REDIRECT_TIMEOUT } from '../constants';
import { ease, grey } from '../css';
import { focusAndScrollSmooth } from '../dom';
import { apiDelete, apiGet, apiPatch, apiPost } from '../fetch';
import { monospaced } from '../fonts.css';
import {
  Button,
  ButtonSpan,
  CancelButton,
  DeleteButton,
  ErrorMessage,
  H1Styled,
  H2Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage,
  TextArea
} from './shared-styled-components';
import Toggle from './toggle';

import { confirmPromise, formatPostDate } from '../utils';

const PublishPostFormContainer = styled.div`
  position: absolute;
  top: 65px;
  left: 0;
  width: 100%;
  z-index: 10;
  background-color: white;
`;
const PublishPostForm = styled.div`
  position: relative;
  width: 50%;
  left: 25%;
  padding: 0 20px 40px 20px;
`;
const InputContainerStyled = styled(InputContainer)`
  opacity: 1;
  ${ease('opacity')};
  ${p =>
    p.shouldHide &&
    css`
      opacity: 0.4;
    `}
`;
const ToggleWrapper = styled.div`
  padding: 0 16px 8px;
`;
const ToggleLabel = styled.span`
  flex-grow: 2;
  font-family: ${monospaced}, monospaced;
  color: ${grey};
  font-size: 18px;
  line-height: 24px;
`;

export default class PublishMenu extends React.Component {
  inputRef = React.createRef();

  constructor(props) {
    super(props);
    this.state = {
      post: props.post,
      error: null,
      successMessage: null,
      redirectUrl: false
    };
  }

  async componentDidMount() {
    let {
      state: { post }
    } = this;
    const syncTitleAndAbstract = post.getIn(
      ['meta', 'syncTitleAndAbstract'],
      false
    );
    const syncTopPhoto = post.getIn(['meta', 'syncTopPhoto'], false);

    if (syncTitleAndAbstract || syncTopPhoto) {
      const {
        error,
        data: { title, abstract, imageUrl }
      } = await apiGet(`/post-summary/${post.get('id')}`);
      if (error) {
        console.error(error);
        return;
      }
      if (syncTitleAndAbstract) {
        post = post.set('title', title).set('abstract', abstract);
      }
      if (syncTopPhoto) {
        post = post.set('imageUrl', imageUrl);
      }
      this.setState({ post });
    }
    focusAndScrollSmooth(null, this.inputRef?.current);
  }

  updatePost = (fieldName, value) => {
    const {
      state: { post }
    } = this;
    this.setState({
      post: post.setIn(fieldName, value),
      error: null,
      successMessage: null
    });
  };

  savePost = async () => {
    const {
      state: { post }
    } = this;
    const { error } = await apiPatch(`/post/${post.get('id')}`, {
      title: post.get('title'),
      canonical: post.get('canonical'),
      abstract: post.get('abstract'),
      imageUrl: post.get('imageUrl'),
      meta: post.get('meta')
    });
    if (error) {
      this.setState({
        successMessage: null,
        error
      });
      return { error };
    }
    this.setState(
      {
        successMessage: true,
        error: null
      },
      () => {
        setTimeout(
          () => this.setState({ successMessage: null }),
          POST_ACTION_REDIRECT_TIMEOUT
        );
      }
    );
    return {};
  };

  publishPost = async () => {
    const {
      state: { post }
    } = this;

    const didConfirm = await confirmPromise(
      'Publish this post?  This makes it public.'
    );
    if (!didConfirm) {
      return;
    }
    let error;
    ({ error } = await this.savePost());
    if (error) {
      this.setState({ error });
      return;
    }
    ({ error } = await apiPost(`/publish/${post.get('id')}`));
    if (error) {
      this.setState({ error });
      return;
    }
    this.setState(
      {
        successMessage: true,
        error: null
      },
      () => {
        setTimeout(
          () =>
            this.setState({
              redirectUrl: `/p/${post.get('canonical')}`
            }),
          POST_ACTION_REDIRECT_TIMEOUT
        );
      }
    );
  };

  deletePost = async () => {
    const {
      state: { post },
      props: { afterDelete }
    } = this;
    if (post.get('published')) {
      const didConfim = await confirmPromise(
        `Delete post ${post.get('title')}?`
      );
      if (!didConfim) {
        return;
      }
      const { error } = await apiDelete(`/post/${post.get('id')}`);
      if (error) {
        console.error('Delete post error:', error);
        return;
      }
      afterDelete?.();
      return;
    }
    const didConfirm = await confirmPromise(
      `Delete draft ${post.get('title')}?`
    );
    if (!didConfirm) {
      return;
    }
    const { error } = await apiDelete(`/draft/${post.get('id')}`);
    if (error) {
      console.error('Delete draft error:', error);
      return;
    }
    afterDelete?.();
  };

  render() {
    const {
      props: { close },
      state: { post, redirectUrl, error, successMessage }
    } = this;
    const syncTitleAndAbstract = post.getIn(
      ['meta', 'syncTitleAndAbstract'],
      false
    );
    const syncTopPhoto = post.getIn(['meta', 'syncTopPhoto'], false);

    if (redirectUrl) {
      return <Redirect to={redirectUrl} />;
    }
    return (
      <PublishPostFormContainer>
        <PublishPostForm>
          <H1Styled>
            Manage{post.get('published') ? ' Post' : ' Draft'}
          </H1Styled>
          <H2Styled>Edit Listing Details, Publish & Delete</H2Styled>
          <InputContainerStyled
            shouldHide={post.getIn(['meta', 'syncTitleAndAbstract'])}
            key="title"
          >
            <Label htmlFor="title" error={error?.title}>
              title
            </Label>
            <Input
              name="title"
              type="text"
              value={post.get('title')}
              disabled={
                post.getIn(['meta', 'syncTitleAndAbstract']) && 'disabled'
              }
              onChange={e => {
                this.updatePost(['title'], e.target.value);
              }}
              error={error?.title}
              ref={this.inputRef}
            />
          </InputContainerStyled>
          <InputContainerStyled
            shouldHide={post.get('published')}
            key="canonical"
          >
            <Label htmlFor="canonical" error={error?.canonical}>
              canonical
            </Label>
            <Input
              name="canonical"
              type="text"
              value={post.get('canonical')}
              disabled={post.get('published') && 'disabled'}
              onChange={e => {
                this.updatePost(['canonical'], e.target.value);
              }}
              error={error?.canonical}
            />
          </InputContainerStyled>
          <InputContainerStyled
            shouldHide={post.getIn(['meta', 'syncTitleAndAbstract'])}
            key="abstract"
          >
            <Label htmlFor="abstract" error={error?.abstract}>
              abstract
            </Label>
            <TextArea
              name="abstract"
              type="text"
              value={post.get('abstract')}
              disabled={
                post.getIn(['meta', 'syncTitleAndAbstract']) && 'disabled'
              }
              onChange={e => {
                this.updatePost(['abstract'], e.target.value);
              }}
              error={error?.abstract}
            />
          </InputContainerStyled>
          <InputContainerStyled
            shouldHide={post.getIn(['meta', 'syncTopPhoto'])}
            key="imageUrl"
          >
            <Label htmlFor="imageUrl" error={error?.imageUrl}>
              imageUrl
            </Label>
            <Input
              name="imageUrl"
              type="text"
              value={post.get('imageUrl')}
              disabled={post.getIn(['meta', 'syncTopPhoto']) && 'disabled'}
              onChange={e => {
                this.updatePost(['imageUrl'], e.target.value);
              }}
              error={error?.imageUrl}
            />
          </InputContainerStyled>
          <MessageContainer>
            {error && (
              <ErrorMessage>
                Error:{` ${Object.values(error).join('')}`}
                <span role="img" aria-label="woman shrugging">
                  🤷 ‍
                </span>
              </ErrorMessage>
            )}
            {successMessage && (
              <SuccessMessage>
                Saved{' '}
                <span role="img" aria-label="thumbs up">
                  👍
                </span>
              </SuccessMessage>
            )}
          </MessageContainer>
          <ToggleWrapper>
            <Toggle
              value={syncTitleAndAbstract}
              onUpdate={() =>
                this.updatePost(
                  ['meta', 'syncTitleAndAbstract'],
                  !syncTitleAndAbstract
                )
              }
            >
              <ToggleLabel>
                Keep Title and Abstract in sync with top 2 sections of content?
              </ToggleLabel>
            </Toggle>
          </ToggleWrapper>
          <ToggleWrapper>
            <Toggle
              value={syncTopPhoto}
              onUpdate={() =>
                this.updatePost(['meta', 'syncTopPhoto'], !syncTopPhoto)
              }
            >
              <ToggleLabel>
                Keep Image in sync with first Photo in content?
              </ToggleLabel>
            </Toggle>
          </ToggleWrapper>
          <Button onClick={this.savePost}>
            <ButtonSpan>Save</ButtonSpan>
          </Button>
          <Button
            onClick={this.publishPost}
            disabled={post.get('published') && 'disabled'}
          >
            <ButtonSpan>{`${
              post.get('published')
                ? `Published on ${formatPostDate(post.get('published'))}`
                : 'Publish'
            }`}</ButtonSpan>
          </Button>
          <CancelButton onClick={close}>
            <ButtonSpan>Close</ButtonSpan>
          </CancelButton>
          <DeleteButton onClick={this.deletePost}>
            <ButtonSpan>Delete</ButtonSpan>
          </DeleteButton>
        </PublishPostForm>
      </PublishPostFormContainer>
    );
  }
}
