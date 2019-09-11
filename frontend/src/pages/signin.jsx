import * as React from 'react';
import styled from 'styled-components';
import { Link, Redirect } from 'react-router-dom';

import { signin } from '../common/session';

import {
  H1,
  H3,
  A,
  InputContainer,
  Input,
  Label,
  SuccessMessage,
  ErrorMessage,
  MessageContainer,
  Button,
  ButtonSpan,
  CancelButton,
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
  margin: 140px auto 100px;
  overflow: hidden;
  background-color: white;
  border-radius: 2px;
`;
const StyledLinkStyled = styled(LinkStyled)`
  display: block;
  position: static;
  padding-bottom: 24px;
`;
const LinkStyled2 = styled(Link)`
  text-decoration: none;
`;
const StyledA = styled(A)``;


export default class SignIn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      error: null,
      success: null,
      shouldRedirect: false,
    }
  }
  
  updateUsername = (event) => {
    this.setState({ username: event.target.value, error: null })
  }
  updatePassword = (event) => {
    this.setState({ password: event.target.value, error: null })
  }
  
  doLogin = async (event) => {
    event.preventDefault();
    try {
      const { username, password } = this.state;
      await signin(username, password);
      this.setState({ success: 'All set 👍' })
      setTimeout(() => {
        this.setState({ shouldRedirect: true });
      }, 500)
    } catch (error) {
      console.error('Login Error: ', error);
      this.setState({ error })
    }
  }
  
  render() {
    const { error, success, shouldRedirect } = this.state;
    if (shouldRedirect) {
      return (<Redirect push to="/" />);
    }
    return (
      <Container>
        <SignInForm onSubmit={this.doLogin}>
          <StyledLinkStyled to="/">dubaniewi.cz</StyledLinkStyled>
          <H1>Sign In</H1>
          <H3>Want an account? <StyledA href="javascript:alert('Coming soon!')">Click here</StyledA></H3>
          <InputContainer>
            <Label htmlFor="username" error={error}>Username</Label>
            <Input name="username" type="text" value={this.state.username} onChange={this.updateUsername}
                   error={error} />
          </InputContainer>
          <InputContainer>
            <Label htmlFor="password" error={error}>Password</Label>
            <Input name="password" type="password" value={this.state.password} onChange={this.updatePassword}
                   error={error} />
          </InputContainer>
          <MessageContainer>
            {error && (<ErrorMessage>Try again. 👮</ErrorMessage>)}
            {success && (<SuccessMessage>{success}</SuccessMessage>)}
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
