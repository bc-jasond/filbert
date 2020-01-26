import React from 'react';
import styled from 'styled-components';
import { focusAndScrollSmooth } from '../dom';
import {
  Button,
  ButtonSpan,
  CancelButton,
  ErrorMessage,
  H1Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage,
  TextArea
} from './shared-styled-components';

import { formatPostDate } from '../utils';

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
  componentDidMount() {
    focusAndScrollSmooth(null, this.inputRef?.current);
  }
  render() {
    const {
      props: {
        post,
        updatePost,
        publishPost,
        savePost,
        close,
        successMessage,
        errorMessage
      }
    } = this;
    
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
                  <Label htmlFor={fieldName} error={errorMessage?.[fieldName]}>
                    {fieldName}
                  </Label>
                  <StyledComponent
                    name={fieldName}
                    type="text"
                    value={fieldValue}
                    disabled={disabled(post) && 'disabled'}
                    onChange={e => {
                      updatePost(fieldName, e.target.value);
                    }}
                    error={errorMessage?.[fieldName]}
                    ref={idx === 0 ? this.inputRef : () => {}}
                  />
                </InputContainer>
              );
            }
          )}
          <MessageContainer>
            {errorMessage && (
              <ErrorMessage>
                Error:{` ${Object.values(errorMessage).join('')}`}
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
          <Button onClick={savePost}>
            <ButtonSpan>Save</ButtonSpan>
          </Button>
          <Button
            onClick={publishPost}
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
        </PublishPostForm>
      </PublishPostFormContainer>
    );
  }
}
