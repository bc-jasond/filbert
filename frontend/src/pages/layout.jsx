import React from 'react';

import { getSession, getUserName, signout } from '../common/session';

import {
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  LinkStyled,
  LinkStyledSignIn,
  SignedInUser,
  NewPost,
  LinkStyledAbout,
  HeaderSpacer,
  Article,
  Footer,
  SocialLinksContainer,
  A,
  GitHubStyled,
  LinkedInStyled,
} from '../common/layout-styled-components';

export default (props) => (
  <React.Fragment>
    <Header>
      <HeaderContentContainer>
        <LinkStyled to="/">dubaniewi.cz</LinkStyled>
        <HeaderLinksContainer>
          {getSession()
            ? (
              <React.Fragment>
                <NewPost to="/new">new post</NewPost>
                <SignedInUser onClick={() => {
                  if (confirm('Logout?')) {
                    signout();
                    // TODO: do something with state/props here
                    window.location.reload();
                  }
                }}>{getUserName()}</SignedInUser>
              </React.Fragment>
            )
            : (<LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>)}
          <LinkStyledAbout to="/about">i</LinkStyledAbout>
        </HeaderLinksContainer>
      </HeaderContentContainer>
    </Header>
    <HeaderSpacer />
    <Article>
      {props.children}
    </Article>
    <Footer>
      🚚 1/4/2019
      <SocialLinksContainer>
        <A href="https://github.com/bc-jasond/dubaniewicz-site"><GitHubStyled /></A>
        <A href="https://www.linkedin.com/in/jasondubaniewicz/"><LinkedInStyled /></A>
      </SocialLinksContainer>
    </Footer>
  </React.Fragment>
);
