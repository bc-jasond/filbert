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
} from '../../common/shared-styled-components';

import { formatPostDate } from '../../common/utils';

const publishPostFields = [
  {
    fieldName: 'title',
    StyledComponent: Input,
    disabled: () => false,
  }, {
    fieldName: 'canonical',
    StyledComponent: Input,
    disabled: post => { console.log(post.get('published')); return post.get('published') },
  }, {
    fieldName: 'abstract',
    StyledComponent: TextArea,
    disabled: () => false,
  }
];

const PublishPostFormContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  background-color: white;
`
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
                }) => (
  <PublishPostFormContainer>
    <PublishPostForm>
      <H1>{`${post.get('published') ? 'Post' : 'Draft'}: Details & Publish`}</H1>
      {publishPostFields.map(({ fieldName, StyledComponent, disabled }, idx) => (
        <InputContainer key={idx}>
          <Label htmlFor={fieldName} error={false /*TODO*/}>{fieldName}</Label>
          <StyledComponent name={fieldName} type="text" value={post.get(fieldName, '')}
                           disabled={disabled(post) && 'disabled'}
                           onChange={(e) => {
                             updatePost(fieldName, e.target.value)
                           }}
                           error={false /*TODO*/} />
        </InputContainer>
      ))}
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
