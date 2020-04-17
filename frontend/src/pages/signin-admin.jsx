import React, { useEffect, useRef, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import { LogoLinkStyled } from '../common/components/layout-styled-components';

import {
  Button,
  ButtonSpan,
  CancelButton,
  ErrorMessage,
  H1Styled,
  H3Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage,
} from '../common/components/shared-styled-components';

import { signinAdmin } from '../common/fetch';
import { getSession } from '../common/session';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const SignInForm = styled.form`
  width: 33vw;
  max-width: 450px;
  min-width: 320px;
  padding: 40px;
  overflow: hidden;
  background-color: white;
  border-radius: 2px;
`;
const StyledLinkStyled = styled(LogoLinkStyled)`
  display: block;
  position: static;
  padding-bottom: 24px;
`;
const LinkStyled2 = styled(Link)`
  text-decoration: none;
`;

export default React.memo(({ setSession }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const usernameRef = useRef(null);

  useEffect(() => {
    usernameRef.current.focus();
  }, []);

  async function doLogin(event) {
    event.preventDefault();
    try {
      await signinAdmin(username, password);
      setError(null);
      setSuccess('All set 👍');
      setTimeout(() => {
        setShouldRedirect(true);
        // set session on App state on the way out...
        setSession(getSession());
      }, 500);
    } catch (err) {
      console.error('Login Error: ', err);
      setError(err);
      setSuccess(null);
    }
  }

  function updatePassword(event) {
    setPassword(event.target.value);
    setError(null);
  }

  function updateUsername(event) {
    setUsername(event.target.value);
    setError(null);
  }

  if (shouldRedirect) {
    return <Redirect push to="/private" />;
  }
  return (
    <Container>
      <SignInForm onSubmit={doLogin}>
        <StyledLinkStyled to="/">
          <span role="img" aria-label="hand writing with a pen">
            ✍️
          </span>{' '}
          filbert
        </StyledLinkStyled>
        <H1Styled>Admin Sign In</H1Styled>
        <H3Styled>
          Looking for User Sign In? <Link to="/signin">Click here</Link>
        </H3Styled>
        <InputContainer>
          <Label htmlFor="username" error={error}>
            Username
          </Label>
          <Input
            name="username"
            type="text"
            value={username}
            onChange={updateUsername}
            error={error}
            ref={usernameRef}
          />
        </InputContainer>
        <InputContainer>
          <Label htmlFor="password" error={error}>
            Password
          </Label>
          <Input
            name="password"
            type="password"
            value={password}
            onChange={updatePassword}
            error={error}
          />
        </InputContainer>
        <MessageContainer>
          {error && (
            <ErrorMessage>
              Try again.{' '}
              <span role="img" aria-label="male police officer">
                👮
              </span>
            </ErrorMessage>
          )}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </MessageContainer>
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
});
