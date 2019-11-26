import React from 'react';
import styled from 'styled-components';
import {
  H1,
  Button,
  ButtonSpan,
  CancelButton,
  Input,
  TextArea,
  InputContainer,
  Label,
  ErrorMessage,
  SuccessMessage,
  MessageContainer,
} from './shared-styled-components';

import {formatPostDate} from './utils';

const publishPostFields = [
  {
    fieldName: 'title',
    StyledComponent: Input,
    disabled: () => false,
  }, {
    fieldName: 'canonical',
    StyledComponent: Input,
    disabled: post => {
      return post.get('published')
    },
  }, {
    fieldName: 'abstract',
    StyledComponent: TextArea,
    disabled: () => false,
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

export default ({
                  post,
                  updatePost,
                  publishPost,
                  savePost,
                  close,
                  successMessage,
                  errorMessage,
                  forwardRef,
                }) => (
  <PublishPostFormContainer>
    <PublishPostForm>
      <H1>{`${post.get('published') ? 'Post' : 'Draft'}: Details & Publish`}</H1>
      {publishPostFields.map(({fieldName, StyledComponent, disabled}, idx) => {
          const fieldValue = post.get(fieldName) || ''; // null doesn't fail the notSetValue check in ImmutableJS
          return (
            <InputContainer key={idx}>
              <Label htmlFor={fieldName} error={false /*TODO*/}>{fieldName}</Label>
              <StyledComponent name={fieldName} type="text" value={fieldValue}
                               disabled={disabled(post) && 'disabled'}
                               onChange={(e) => {
                                 updatePost(fieldName, e.target.value)
                               }}
                               error={false /*TODO*/}
                               ref={idx === 0 ? forwardRef : () => {}}
              />
            </InputContainer>
          )
        }
      )}
      <MessageContainer>
        {errorMessage && (<ErrorMessage>Error 🤷‍</ErrorMessage>)}
        {successMessage && (<SuccessMessage>Saved 👍</SuccessMessage>)}
      </MessageContainer>
      <Button onClick={savePost}>
        <ButtonSpan>
          Save
        </ButtonSpan>
      </Button>
      <CancelButton onClick={close}>
        <ButtonSpan>Close</ButtonSpan>
      </CancelButton>
      <Button onClick={publishPost} disabled={post.get('published') && 'disabled'}>
        <ButtonSpan>{`${post.get('published') ? `Published on ${formatPostDate(post.get('published'))}` : 'Publish'}`}</ButtonSpan>
      </Button>
    </PublishPostForm>
  </PublishPostFormContainer>
)
