import * as React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

import { blue, darkBlue, grey, mediumGrey } from '../common/css';
import { monospaced, sansSerif } from '../common/fonts.css';

import {
  H1,
  H3,
  A,
} from '../common/shared-styled-components';
import {
  LinkStyled,
} from '../common/layout-styled-components';

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  position: absolute;
  justify-content: center;
  align-items: center;
`;
const SignInForm = styled.form`
  width: 33vw;
  max-width: 450px;
  min-width: 320px;
  padding: 40px;
  margin: 0 auto 100px;
  overflow: hidden;
  background-color: white;
  border-radius: 2px;
`;
const StyledLinkStyled = styled(LinkStyled)`
  display: block;
  position: static;
  padding-bottom: 24px;
`;
const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 24px 0;
  &:last-of-type {
    margin-bottom: 48px;
  }
`;
const Input = styled.input`
  font-size: 18px;
  font-weight: 400;
  font-family: ${monospaced};
  line-height: 36px;
  border-radius: 2px;
  border: 1px solid ${grey};
  padding: 2px 8px;
`;
const Label = styled.label`
  margin-bottom: 4px;
  font-family: ${sansSerif};
`;
const Button = styled.button`
  display: block;
  border-radius: 26px;
  width: 100%;
  margin-bottom: 16px;
  background: ${blue};
  border: 0;
  padding: 14px 18px;
  font-size: 18px;
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-appearance: none;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  
  &:hover {
    background: ${darkBlue};
  }
`;
const CancelButton = styled(Button)`
  background: ${mediumGrey};
  margin-bottom: 0;
  &:hover {
    background: ${grey};
  }
`;
const ButtonSpan = styled.span`
  color: white;
  font-family: ${sansSerif};
`;
const LinkStyled2 = styled(Link)`
  text-decoration: none;
`;
const StyledA = styled(A)`
  // color: ${blue};
`;

export default () => (
  <Container>
    <SignInForm>
      <StyledLinkStyled to="/">dubaniewi.cz</StyledLinkStyled>
      <H1>Sign In</H1>
      <H3>Want an account? <StyledA href="javascript:alert('Coming soon!')">Click here</StyledA></H3>
      <InputContainer>
        <Label htmlFor="username">Username</Label>
        <Input name="username" />
      </InputContainer>
      <InputContainer>
        <Label htmlFor="password">Password</Label>
        <Input name="password" type="password" />
      </InputContainer>
      <Button type="submit">
        <ButtonSpan>Sign In</ButtonSpan>
      </Button>
      <LinkStyled2 to="/">
        <CancelButton>
          <ButtonSpan>Cancel</ButtonSpan>
        </CancelButton>
      </LinkStyled2>
    </SignInForm>
  </Container>
);
