import * as React from 'react';
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
  SuccessMessage
} from '../common/components/shared-styled-components';
import { darkGrey } from '../common/css';
import { loadScript } from '../common/dom';
import { apiGet } from '../common/fetch';
import ButtonSpinner from '../common/components/button-spinner';
import { sansSerif } from '../common/fonts.css';

import { getSession, signinGoogle, signout } from '../common/session';
import { stopAndPrevent } from '../common/utils';

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
  background: white;
  margin-bottom: 16px;
  font-size: 18px;
  &:hover {
    background: white;
  }
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
  color: ${darkGrey};
  overflow: hidden;
  white-space: pre-wrap;
  text-overflow: ellipsis;
  padding: 4px;
`;

const usernameRef = React.createRef();

export default class SignIn extends React.Component {
  GoogleAuth;

  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      success: null,
      shouldRedirect: false,
      username: '',
      googleUser: {},
      shouldShowUsernameInput: false
    };
  }

  async componentDidMount() {
    if (usernameRef && usernameRef.current) {
      usernameRef.current.focus();
    }
    window.initThaGoog = async () => {
      this.setState({ loading: true });
      await new Promise(resolve => gapi.load('auth2', resolve));
      await gapi.auth2.init({
        client_id: process.env.GOOGLE_API_FILBERT_CLIENT_ID
      });
      this.GoogleAuth = gapi.auth2.getAuthInstance();
      if (this.GoogleAuth.isSignedIn.get()) {
        const user = this.GoogleAuth.currentUser.get();
        await this.setGoogleUser(user);
      }
      this.setState({ loading: false });
    };
    if (!this.GoogleAuth) {
      await loadScript(
        'https://apis.google.com/js/platform.js?onload=initThaGoog'
      );
    } else if (this.GoogleAuth.isSignedIn.get()) {
      const user = this.GoogleAuth.currentUser.get();
      this.setGoogleUser(user);
    }
    this.setState({ loading: false });
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

  doLoginGoogle = async evt => {
    try {
      const {
        state: { googleUser, username }
      } = this;
      let currentUser;
      // evt is a 'submit' event, we don't want the page to reload

      stopAndPrevent(evt);

      this.setState({ success: null, error: null, loading: true });

      if (!googleUser?.idToken) {
        // open google window to let the user select a user to login as, or to grant access
        const user = await this.GoogleAuth.signIn();
        currentUser = await this.setGoogleUser(user);
      } else {
        // user was already logged in and set in this.state
        currentUser = googleUser;
      }
      const { signupIsIncomplete } = await signinGoogle(currentUser, username);
      if (signupIsIncomplete) {
        this.setState(
          {
            shouldShowUsernameInput: true,
            error: null,
            success: null,
            loading: false
          },
          () => {
            usernameRef.current.focus();
          }
        );
        return;
      }
      this.setState({ success: 'All set 👍', error: null });
      setTimeout(() => {
        this.setState({ shouldRedirect: true }, () => {
          // set session on App state on the way out...
          this.props?.setSession?.(getSession());
        });
      }, 400);
    } catch (error) {
      this.setState({
        success: null,
        error: error?.error || error?.message || 'Error',
        loading: false
      });
    }
  };

  doLogout = async () => {
    this.setState({ error: null, success: null, loading: true });
    await this.GoogleAuth.signOut();
    signout();
    this.setState({ googleUser: {}, loading: false });
  };

  updateUsername = event => {
    const {
      target: { value }
    } = event;
    const {
      state: { username }
    } = this;
    const newUsername = value.replace(/[^0-9a-z]/g, '');
    if (newUsername === username) {
      return;
    }
    this.setState({ username: newUsername, error: null, loading: true }, () => {
      if (this.checkUsernameTimeout) {
        clearTimeout(this.checkUsernameTimeout);
      }
      if (newUsername.length < 5) {
        this.setState({
          error: `${newUsername} is too short.  Pick a username between 5 and 42 characters.`,
          success: null,
          loading: false
        });
        return;
      }
      if (newUsername.length > 42) {
        this.setState({
          error: `${newUsername} is too long.  Pick a username between 5 and 42 characters.`,
          success: null,
          loading: false
        });
        return;
      }
      this.checkUsernameTimeout = setTimeout(async () => {
        try {
          await apiGet(`/user/${newUsername}`);
          this.setState({
            error: `${newUsername} is taken`,
            success: null,
            loading: false
          });
        } catch (err) {
          this.setState({
            success: `"${newUsername}" is available 👍`,
            error: null,
            loading: false
          });
        }
      }, 750);
    });
  };

  render() {
    const {
      state: {
        loading,
        error,
        success,
        shouldRedirect,
        shouldShowUsernameInput,
        username,
        googleUser: { name, givenName, imageUrl, email }
      }
    } = this;
    if (shouldRedirect) {
      const queryParams = new URLSearchParams(window.location.search);
      const nextUrl = queryParams.get('next') || '/private'; // returns null if empty
      return <Redirect push to={nextUrl} />;
    }
    return (
      <Container>
        <SignInForm onSubmit={this.doLoginGoogle}>
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
                  onChange={this.updateUsername}
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
                ? `Continue as ${
                    shouldShowUsernameInput ? username : givenName
                  }`
                : 'Sign in to filbert with Google'
            }
          >
            <GoogleIcon />
          </GoogleSigninButton>
          {!shouldShowUsernameInput && givenName ? (
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
        </SignInForm>
      </Container>
    );
  }
}
