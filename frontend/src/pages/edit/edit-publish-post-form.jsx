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

const publishPostFields = [
  {
    fieldName: 'title',
    StyledComponent: Input,
  }, {
    fieldName: 'canonical',
    StyledComponent: Input,
  }, {
    fieldName: 'abstract',
    StyledComponent: TextArea,
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
      <H1>Update Post Details & Publish</H1>
      {publishPostFields.map(({ fieldName, StyledComponent }, idx) => (
        <InputContainer key={idx}>
          <Label htmlFor={fieldName} error={false /*TODO*/}>{fieldName}</Label>
          <StyledComponent name={fieldName} type="text" value={post.get(fieldName, '')}
                           onChange={(e) => {
                             updatePost(fieldName, e.target.value)
                           }}
                           error={false /*TODO*/} />
        </InputContainer>
      ))}
      <MessageContainer>
        {errorMessage && (<ErrorMessage>Error. 🤷‍</ErrorMessage>)}
        {successMessage && (<SuccessMessage>Saved. 👍</SuccessMessage>)}
      </MessageContainer>
      <Button onClick={savePost}>
        <ButtonSpan>
          Save
        </ButtonSpan>
      </Button>
      <CancelButton onClick={close}>
        <ButtonSpan>Close</ButtonSpan>
      </CancelButton>
      <Button onClick={publishPost}>
        <ButtonSpan>Publish</ButtonSpan>
      </Button>
    </PublishPostForm>
  </PublishPostFormContainer>
)
