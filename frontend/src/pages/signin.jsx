import * as React from 'react';
import styled from 'styled-components';
import { Link, Redirect } from 'react-router-dom';

import { signin } from '../common/session';

import {
  A,
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
import { LogoLinkStyled } from '../common/components/layout-styled-components';

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
const StyledA = styled(A)``;

const usernameRef = React.createRef();

export default class SignIn extends React.Component {
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

  componentDidMount() {
    if (usernameRef && usernameRef.current) {
      usernameRef.current.focus();
    }
  }

  updateUsername = event => {
    this.setState({ username: event.target.value, error: null });
  };

  updatePassword = event => {
    this.setState({ password: event.target.value, error: null });
  };

  doLogin = async event => {
    event.preventDefault();
    try {
      const { username, password } = this.state;
      await signin(username, password);
      this.setState({
        error: null,
        success: 'All set 👍'
      });
      setTimeout(() => {
        this.setState({ shouldRedirect: true });
      }, 500);
    } catch (error) {
      console.error('Login Error: ', error);
      this.setState({
        error,
        success: null
      });
    }
  };

  render() {
    const { error, success, shouldRedirect } = this.state;
    if (shouldRedirect) {
      return <Redirect push to="/" />;
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
          <H1Styled>Sign In</H1Styled>
          <H3>
            Want an account?{' '}
            <StyledA onClick={() => alert('Coming soon!')}>Click here</StyledA>
          </H3>
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
