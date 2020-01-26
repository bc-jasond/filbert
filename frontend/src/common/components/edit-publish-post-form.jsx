import React from 'react';
import { Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { POST_ACTION_REDIRECT_TIMEOUT } from '../constants';
import { focusAndScrollSmooth } from '../dom';
import { apiDelete, apiPatch, apiPost } from '../fetch';
import {
  Button,
  ButtonSpan,
  CancelButton,
  DeleteButton,
  ErrorMessage,
  H1Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage,
  TextArea
} from './shared-styled-components';

import { confirmPromise, formatPostDate } from '../utils';

const publishPostFields = [
  {
    fieldName: 'title',
    StyledComponent: Input,
    disabled: () => false
  },
  {
    fieldName: 'canonical',
    StyledComponent: Input,
    disabled: post => {
      return post.get('published');
    }
  },
  {
    fieldName: 'abstract',
    StyledComponent: TextArea,
    disabled: () => false
  }
];

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

  componentDidMount() {
    focusAndScrollSmooth(null, this.inputRef?.current);
  }

  updatePost = (fieldName, value) => {
    const {
      state: { post }
    } = this;
    this.setState({
      post: post.set(fieldName, value),
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
      abstract: post.get('abstract')
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
      state: { post }
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
      // if editing a published post - assume redirect to published posts list
      this.setState({ redirectUrl: '/' });
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
    this.setState({ redirectUrl: '/private' });
  };

  render() {
    const {
      props: { close },
      state: { post, redirectUrl, error, successMessage }
    } = this;

    if (redirectUrl) {
      return <Redirect to={redirectUrl} />;
    }
    return (
      <PublishPostFormContainer>
        <PublishPostForm>
          <H1Styled>{`${
            post.get('published') ? 'Post' : 'Draft'
          }: Details & Publish`}</H1Styled>
          {publishPostFields.map(
            ({ fieldName, StyledComponent, disabled }, idx) => {
              const fieldValue = post.get(fieldName) || ''; // null doesn't fail the notSetValue check in ImmutableJS
              return (
                <InputContainer key={fieldName}>
                  <Label htmlFor={fieldName} error={error?.[fieldName]}>
                    {fieldName}
                  </Label>
                  <StyledComponent
                    name={fieldName}
                    type="text"
                    value={fieldValue}
                    disabled={disabled(post) && 'disabled'}
                    onChange={e => {
                      this.updatePost(fieldName, e.target.value);
                    }}
                    error={error?.[fieldName]}
                    ref={idx === 0 ? this.inputRef : () => {}}
                  />
                </InputContainer>
              );
            }
          )}
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
