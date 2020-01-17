import * as React from 'react';
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
  SuccessMessage
} from '../common/components/shared-styled-components';

import { signin } from '../common/fetch';

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

const usernameRef = React.createRef();

export default class SignInAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      error: null,
      success: null,
      shouldRedirect: false
    };
  }

  async componentDidMount() {
    if (usernameRef && usernameRef.current) {
      usernameRef.current.focus();
    }
  }

  doLogin = async event => {
    event.preventDefault();
    try {
      const {
        state: { username, password }
      } = this;
      const { session } = await signin(username, password);
      this.setState({
        error: null,
        success: 'All set 👍'
      });
      setTimeout(() => {
        this.setState({ shouldRedirect: true }, () => {
          // set session on App state on the way out...
          this.props?.setSession?.(session);
        });
      }, 500);
    } catch (error) {
      console.error('Login Error: ', error);
      this.setState({
        error,
        success: null
      });
    }
  };

  updatePassword = event => {
    this.setState({ password: event.target.value, error: null });
  };

  updateUsername = event => {
    this.setState({ username: event.target.value, error: null });
  };

  render() {
    const {
      state: { error, success, shouldRedirect }
    } = this;
    if (shouldRedirect) {
      return <Redirect push to="/private" />;
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
              value={this.state?.username}
              onChange={this.updateUsername}
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
              value={this.state?.password}
              onChange={this.updatePassword}
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
  }
}
