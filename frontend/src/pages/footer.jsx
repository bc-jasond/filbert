import React from 'react';
import {
  A, Footer,
  GitHubStyled,
  InfoStyled,
  LinkedInStyled,
  LinkStyled,
  SocialLinksContainer
} from '../common/layout-styled-components';

export default () => (
  <Footer>
    🚚 1/4/2019
    <SocialLinksContainer>
      <A href="https://github.com/bc-jasond/dubaniewicz-site"><GitHubStyled /></A>
      <A href="https://www.linkedin.com/in/jasondubaniewicz/"><LinkedInStyled /></A>
      <LinkStyled to="/about"><InfoStyled /></LinkStyled>
    </SocialLinksContainer>
  </Footer>
)