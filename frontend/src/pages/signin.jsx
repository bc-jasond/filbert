import React, { useEffect, useRef, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import GoogleIconSvg from '../../assets/icons/google-logo.svg';
import { LogoLinkStyled } from '../common/components/layout-styled-components';

import {
  ButtonSpan,
  CancelButton,
  ErrorMessage,
  H1Styled,
  H3Styled,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  ProfileImg,
  SuccessMessage,
} from '../common/components/shared-styled-components';
import { loadScript } from '../common/dom';
import { apiGet, signinGoogle } from '../common/fetch';
import ButtonSpinner from '../common/components/button-spinner';
import { sansSerif } from '../fonts.css';

import { getSession, signout } from '../common/session';
import { getGoogleUser, googleAuthInit } from '../common/google-auth';
import useDebounce from '../common/use-debounce.hook';
import { stopAndPrevent } from '../common/utils';
import {
  backgroundColorPrimary,
  getVar,
  titleColorPrimary,
} from '../variables.css';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const SignInForm = styled.form`
  width: 40vw;
  max-width: 450px;
  min-width: 320px;
  padding: 40px;
  overflow: hidden;
  background-color: ${getVar(backgroundColorPrimary)};
  border-radius: 2px;
`;
const StyledLinkStyled = styled(LogoLinkStyled)`
  display: block;
  position: static;
  padding-bottom: 24px;
`;
const H1StyledStyled = styled(H1Styled)`
  margin-bottom: 8px;
`;
const H3StyledStyled = styled(H3Styled)`
  margin-bottom: 24px;
`;
const LinkStyled2 = styled(Link)`
  text-decoration: none;
`;
const Smaller = styled.span`
  display: block;
  font-family: inherit;
  font-size: smaller;
`;
const Smaller2 = styled(Smaller)`
  font-weight: 400;
  margin-top: 16px;
`;
const GoogleSigninButton = styled(ButtonSpinner)``;
const GoogleInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  font-size: 18px;
`;
const GoogleIcon = styled(GoogleIconSvg)`
  position: absolute;
  left: 16px;
  flex-shrink: 0;
  height: 24px;
  width: 24px;
`;
const GoogleInfoSpan = styled.span`
  font-family: ${sansSerif};
  display: block;
  color: ${getVar(titleColorPrimary)};
  overflow: hidden;
  white-space: pre-wrap;
  text-overflow: ellipsis;
  padding: 4px;
`;

export default React.memo(({ setSession }) => {
  const GoogleAuth = useRef(null);
  const usernameRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [username, setUsername] = useState(null);
  const [googleUser, setGoogleUser] = useState({});
  const [shouldShowUsernameInput, setShouldShowUsernameInput] = useState(false);

  const usernameDebounced = useDebounce(username);

  useEffect(() => {
    async function init() {
      window.initThaGoog = async () => {
        setLoading(true);
        GoogleAuth.current = await googleAuthInit();
        if (GoogleAuth.current.isSignedIn.get()) {
          const user = GoogleAuth.current.currentUser.get();
          setGoogleUser(getGoogleUser(user));
        }
        setLoading(false);
      };
      if (!GoogleAuth.current) {
        await loadScript(
          'https://apis.google.com/js/platform.js?onload=initThaGoog'
        );
      } else if (GoogleAuth.current.isSignedIn.get()) {
        const user = GoogleAuth.current.currentUser.get();
        setGoogleUser(getGoogleUser(user));
      }
      setLoading(false);
    }
    init();
    return () => {
      delete window.initThaGoog;
    };
  }, []);

  useEffect(() => {
    async function checkUsernameAvailability() {
      if (!shouldShowUsernameInput || typeof usernameDebounced !== 'string') {
        return;
      }
      if (usernameDebounced.length < 5) {
        setError(
          `${usernameDebounced} is too short.  Pick a username between 5 and 42 characters.`
        );
        setSuccess(null);
        setLoading(false);
        return;
      }
      if (usernameDebounced.length > 42) {
        setError(
          `${usernameDebounced} is too long.  Pick a username between 5 and 42 characters.`
        );
        setSuccess(null);
        setLoading(false);
        return;
      }
      const { error: errorApi } = await apiGet(
        `/user/${usernameDebounced}?forSignup`
      );
      // here a 404 means "not taken"
      if (errorApi) {
        setSuccess(`"${usernameDebounced}" is available 👍`);
        setError(null);
        setLoading(false);
        return;
      }
      setError(`${usernameDebounced} is taken`);
      setSuccess(null);
      setLoading(false);
    }
    checkUsernameAvailability();
  }, [shouldShowUsernameInput, usernameDebounced]);

  async function doLoginGoogle(event) {
    let currentUser;
    // evt is a 'submit' event, we don't want the page to reload
    stopAndPrevent(event);

    setSuccess(null);
    setError(null);
    setLoading(true);

    if (!googleUser?.idToken) {
      // open google window to let the user select a user to login as, or to grant access
      const user = await GoogleAuth.current.signIn();
      currentUser = getGoogleUser(user);
    } else {
      // user was already logged in and set in state
      currentUser = googleUser;
    }
    const { error: errorApi, signupIsIncomplete } = await signinGoogle(
      currentUser,
      username
    );
    if (errorApi) {
      setSuccess(null);
      setError(errorApi?.error || errorApi?.message || 'Error');
      setLoading(false);
      return;
    }
    if (signupIsIncomplete) {
      setShouldShowUsernameInput(true);
      setError(null);
      setSuccess(null);
      setLoading(false);
      usernameRef.current.focus();
      return;
    }
    setSuccess('All set 👍');
    setError(null);
    setTimeout(() => {
      setShouldRedirect(true);
      // set session on App state on the way out...
      setSession(getSession());
    }, 400);
  }

  async function doLogout() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    await GoogleAuth.current.signOut();
    signout();
    setGoogleUser({});
    setLoading(false);
  }

  function updateUsername(event) {
    const {
      target: { value },
    } = event;
    const newUsername = value.replace(/[^0-9a-z]/g, '');
    if (newUsername === username) {
      return;
    }
    setUsername(newUsername);
    setError(null);
    setLoading(true);
  }

  const { name, givenName, imageUrl, email } = googleUser;

  if (shouldRedirect) {
    const queryParams = new URLSearchParams(window.location.search);
    const nextUrl = queryParams.get('next') || '/private'; // returns null if empty
    return <Redirect push to={nextUrl} />;
  }
  return (
    <Container>
      <SignInForm onSubmit={doLoginGoogle}>
        <StyledLinkStyled to="/">
          <span role="img" aria-label="hand writing with a pen">
            ✍️
          </span>{' '}
          filbert
        </StyledLinkStyled>
        <H1StyledStyled>Sign In</H1StyledStyled>
        {imageUrl && name && email && (
          <GoogleInfo>
            <ProfileImg src={imageUrl} />
            <GoogleInfoSpan>{name}</GoogleInfoSpan>
            <GoogleInfoSpan>
              <Smaller>{email}</Smaller>
            </GoogleInfoSpan>
          </GoogleInfo>
        )}
        {shouldShowUsernameInput && (
          <>
            <H3StyledStyled>
              Welcome!
              <Smaller2>
                Just one more step before we continue - Choose a filbert
                username.
              </Smaller2>
            </H3StyledStyled>
            <InputContainer>
              <Label htmlFor="username" error={error}>
                filbert username (lowercase letters a-z and numbers 0-9 only,
                length 5 to 42 characters)
              </Label>
              <Input
                name="username"
                type="text"
                value={username}
                onChange={updateUsername}
                error={error}
                ref={usernameRef}
                autoComplete="off"
                minLength="5"
                maxLength="42"
              />
            </InputContainer>
          </>
        )}
        <MessageContainer>
          {error && (
            <ErrorMessage>
              Try again. {error}{' '}
              <span role="img" aria-label="male police officer">
                👮
              </span>
            </ErrorMessage>
          )}
          {success && <SuccessMessage>{success}</SuccessMessage>}
        </MessageContainer>
        <GoogleSigninButton
          id="google-sign-in-button"
          type="submit"
          primary
          loading={loading}
          label={
            givenName || shouldShowUsernameInput
              ? `Continue as ${shouldShowUsernameInput ? username : givenName}`
              : 'Sign in to filbert with Google'
          }
        >
          <GoogleIcon />
        </GoogleSigninButton>
        {!shouldShowUsernameInput && givenName ? (
          <CancelButton type="button" onClick={doLogout}>
            <ButtonSpan>Logout</ButtonSpan>
          </CancelButton>
        ) : (
          <LinkStyled2 to="/">
            <CancelButton>
              <ButtonSpan>Cancel</ButtonSpan>
            </CancelButton>
          </LinkStyled2>
        )}
      </SignInForm>
    </Container>
  );
});
