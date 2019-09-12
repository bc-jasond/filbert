import React from 'react';
import { Redirect } from 'react-router-dom';

import { getSession, getUserName, signout } from '../common/session';

import {
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  LinkStyled,
  LinkStyledSignIn,
  SignedInUser,
  NewPost,
  ListDrafts,
  HeaderSpacer,
  Article,
  PublishPost,
  DeletePost,
  EditPost,
} from '../common/layout-styled-components';

import Footer from './footer';

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectUrl: null,
    }
  }
  
  afterDeleteCallback = () => {
    this.setState({ redirectUrl: '/' })
  }
  
  afterPublishCallback = () => {
    const { postId } = this.props;
    this.setState({ redirectUrl: `/posts/${postId}` })
  }
  
  render() {
    const { children, postCanonical, postId } = this.props;
    const { redirectUrl } = this.state;
    return redirectUrl
      ? (<Redirect to={redirectUrl} />)
      : (
        <React.Fragment>
          <Header>
            <HeaderContentContainer>
              <LinkStyled to="/">dubaniewi.cz</LinkStyled>
              <HeaderLinksContainer>
                <PublishPost>publish</PublishPost>
                <EditPost to="/foo">edit</EditPost>
                <DeletePost>delete</DeletePost>
                <NewPost to="/edit/new">new</NewPost>
                <ListDrafts to="/drafts">drafts</ListDrafts>
                <SignedInUser onClick={() => {
                  if (confirm('Logout?')) {
                    signout();
                    // TODO: do something with state/props here?
                    window.location.reload();
                  }
                }}>{getUserName()}</SignedInUser>
                <LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>
              </HeaderLinksContainer>
            </HeaderContentContainer>
          </Header>
          <HeaderSpacer />
          <Article>
            {children}
          </Article>
          <Footer />
        </React.Fragment>
      )
  }
}
