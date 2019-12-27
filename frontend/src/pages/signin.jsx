import * as React from 'react';
import { Link, Redirect } from 'react-router-dom';
import styled from 'styled-components';
import GoogleIconSvg from '../../assets/icons/google-logo.svg';
import { LogoLinkStyled } from '../common/components/layout-styled-components';

import {
  Button,
  ButtonSpan,
  CancelButton,
  ErrorMessage,
  H1Styled,
  H3,
  Input,
  InputContainer,
  Label,
  MessageContainer,
  SuccessMessage
} from '../common/components/shared-styled-components';
import { darkGrey } from '../common/css';
import { loadScript } from '../common/dom';
import { apiGet } from '../common/fetch';

import { signinGoogle, signout } from '../common/session';

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
  background-color: white;
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
const H3Styled = styled(H3)`
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
const GoogleSigninButton = styled(Button)`
  display: flex;
  flex-direction: row;
  align-items: center;
  background: white;
  padding: 0 16px;
  height: 52px;
  &:hover {
    background: white;
  }
`;
const GoogleSigninButtonSpan = styled(ButtonSpan)`
  color: ${darkGrey};
  flex-grow: 2;
  text-align: center;
`;
const GoogleInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  margin-bottom: 16px;
  font-size: 18px;
  &:hover {
    background: white;
  }
`;
const GoogleIcon = styled(GoogleIconSvg)`
  position: absolute;
  flex-shrink: 0;
  height: 24px;
  width: 24px;
`;
const GoogleInfoSpan = styled(ButtonSpan)`
  display: block;
  color: ${darkGrey};
  overflow: hidden;
  white-space: pre-wrap;
  text-overflow: ellipsis;
  padding: 4px;
`;
const GoogleProfileImg = styled.img`
  flex-shrink: 0;
  border-radius: 50%;
  margin: 8px;
  position: relative;
  height: 72px;
  width: 72px;
  z-index: 0;
`;

const usernameRef = React.createRef();

export default class SignIn extends React.Component {
  GoogleAuth;

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      success: null,
      shouldRedirect: false,
      username: '',
      googleUser: {},
      shouldShowUsernameInput: false
    };
    const queryParams = new URLSearchParams(window.location.search);
    this.nextUrl = queryParams.get('next'); // returns null if empty
  }

  async componentDidMount() {
    if (usernameRef && usernameRef.current) {
      usernameRef.current.focus();
    }
    window.initThaGoog = async () => {
      await new Promise(resolve => gapi.load('auth2', resolve));
      await gapi.auth2.init({
        client_id: process.env.GOOGLE_API_FILBERT_CLIENT_ID
      });
      this.GoogleAuth = gapi.auth2.getAuthInstance();
      if (this.GoogleAuth.isSignedIn.get()) {
        const user = this.GoogleAuth.currentUser.get();
        this.setGoogleUser(user);
      }
      this.GoogleAuth.attachClickHandler(
        'google-sign-in-button',
        {},
        this.doLoginGoogle,
        error => this.setState({ error, success: null })
      );
    };
    await loadScript(
      'https://apis.google.com/js/platform.js?onload=initThaGoog'
    );
  }

  componentWillUnmount() {
    delete window.initThaGoog;
  }

  setGoogleUser = async user => {
    if (!user.getBasicProfile) {
      return Promise.resolve();
    }
    const profile = user.getBasicProfile();
    const googleUser = {
      name: profile.getName(),
      givenName: profile.getGivenName(),
      imageUrl: profile.getImageUrl(),
      email: profile.getEmail(),
      idToken: user.getAuthResponse().id_token
    };
    return new Promise(resolve =>
      this.setState({ googleUser }, () => resolve(googleUser))
    );
  };

  doLoginGoogle = async user => {
    const {
      state: { googleUser, username }
    } = this;
    const currentUser = googleUser.idToken
      ? googleUser
      : await this.setGoogleUser(user);
    const { signupIsIncomplete } = await signinGoogle(currentUser, username);
    if (signupIsIncomplete) {
      this.setState(
        { shouldShowUsernameInput: true, error: null, success: null },
        () => {
          usernameRef.current.focus();
        }
      );
      return;
    }
    this.setState({ success: 'All set 👍', error: null });
    setTimeout(() => {
      this.setState({ shouldRedirect: true });
    }, 500);
  };

  doLogout = async () => {
    this.setState({ error: null, success: null });
    await this.GoogleAuth.signOut();
    signout();
    this.setState({ googleUser: {} });
  };

  updateUsername = event => {
    const {
      target: { value: newUsername }
    } = event;
    this.setState({ username: newUsername, error: null }, () => {
      if (this.checkUsernameTimeout) {
        clearTimeout(this.checkUsernameTimeout);
      }
      this.checkUsernameTimeout = setTimeout(async () => {
        const usernameIsAvailable = await apiGet(
          `/username-is-available/${newUsername}`
        );
        if (usernameIsAvailable) {
          this.setState({
            success: `"${newUsername}" is available 👍`,
            error: null
          });
          return;
        }
        this.setState({ error: `${newUsername} is taken`, success: null });
      }, 750);
    });
  };

  render() {
    const {
      state: {
        error,
        success,
        shouldRedirect,
        shouldShowUsernameInput,
        username,
        googleUser: { name, givenName, imageUrl, email }
      },
      nextUrl
    } = this;
    if (shouldRedirect) {
      return <Redirect push to={nextUrl || '/'} />;
    }
    return (
      <Container>
        <SignInForm onSubmit={this.doLogin}>
          <StyledLinkStyled to="/">
            <span role="img" aria-label="hand writing with a pen">
              ✍️
            </span>{' '}
            filbert
          </StyledLinkStyled>
          <H1StyledStyled>Sign In</H1StyledStyled>
          {imageUrl && name && email && (
            <GoogleInfo>
              <GoogleProfileImg src={imageUrl} />
              <GoogleInfoSpan>{name}</GoogleInfoSpan>
              <GoogleInfoSpan>
                <Smaller>{email}</Smaller>
              </GoogleInfoSpan>
            </GoogleInfo>
          )}
          {shouldShowUsernameInput ? (
            <>
              <H3Styled>
                Welcome!
                <Smaller>
                  Just one more step before we continue. Choose a filbert
                  username.
                </Smaller>
              </H3Styled>
              <InputContainer>
                <Label htmlFor="username" error={error}>
                  filbert username
                </Label>
                <Input
                  name="username"
                  type="text"
                  value={username}
                  onChange={this.updateUsername}
                  error={error}
                  ref={usernameRef}
                  autoComplete="off"
                />
              </InputContainer>
              <MessageContainer>
                {error && (
                  <ErrorMessage>
                    Try again. {JSON.stringify(error)}
                    <span role="img" aria-label="male police officer">
                      {' '}
                      👮
                    </span>
                  </ErrorMessage>
                )}
                {success && <SuccessMessage>{success}</SuccessMessage>}
              </MessageContainer>
              <GoogleSigninButton
                disabled={error}
                type="button"
                onClick={this.doLoginGoogle}
              >
                <GoogleIcon />
                <GoogleSigninButtonSpan>
                  Continue as {username}
                </GoogleSigninButtonSpan>
              </GoogleSigninButton>
              <LinkStyled2 to="/">
                <CancelButton>
                  <ButtonSpan>Cancel</ButtonSpan>
                </CancelButton>
              </LinkStyled2>
            </>
          ) : (
            <>
              <MessageContainer>
                {error && (
                  <ErrorMessage>
                    Try again. {JSON.stringify(error)}
                    <span role="img" aria-label="male police officer">
                      👮
                    </span>
                  </ErrorMessage>
                )}
                {success && <SuccessMessage>{success}</SuccessMessage>}
              </MessageContainer>
              <GoogleSigninButton id="google-sign-in-button" type="button">
                <GoogleIcon />
                <GoogleSigninButtonSpan>
                  {givenName
                    ? `Continue as ${givenName}`
                    : 'Sign in to filbert with Google'}
                </GoogleSigninButtonSpan>
              </GoogleSigninButton>
              {name ? (
                <CancelButton type="button" onClick={this.doLogout}>
                  <ButtonSpan>Logout</ButtonSpan>
                </CancelButton>
              ) : (
                <LinkStyled2 to="/">
                  <CancelButton>
                    <ButtonSpan>Cancel</ButtonSpan>
                  </CancelButton>
                </LinkStyled2>
              )}
            </>
          )}
        </SignInForm>
      </Container>
    );
  }
}
