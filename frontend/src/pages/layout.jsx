import React from 'react';

import {
  Header,
  HeaderContentContainer,
  LinkStyled,
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
        <LinkStyledAbout to="/about">i</LinkStyledAbout>
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
