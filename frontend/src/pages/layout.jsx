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
  ListDrafts,
  HeaderSpacer,
  Article,
  Footer,
  SocialLinksContainer,
  A,
  GitHubStyled,
  LinkedInStyled,
  InfoStyled,
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
                <NewPost to="/edit/new">new post</NewPost>
                <ListDrafts to="/drafts">drafts</ListDrafts>
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
        <LinkStyled to="/about"><InfoStyled /></LinkStyled>
      </SocialLinksContainer>
    </Footer>
  </React.Fragment>
);
