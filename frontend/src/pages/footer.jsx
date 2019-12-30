import React from 'react';
import {
  A,
  FooterStyled,
  GitHubStyled,
  InfoStyled,
  LinkedInStyled,
  LogoLinkStyled,
  SocialLinksContainer
} from '../common/components/layout-styled-components';

export default () => (
  <FooterStyled>
    <span role="img" aria-label="truck">
      🚚
    </span>{' '}
    1/4/2019
    <SocialLinksContainer>
      <A href="https://github.com/bc-jasond/filbert">
        <GitHubStyled />
      </A>
      <A href="https://www.linkedin.com/in/jasondubaniewicz/">
        <LinkedInStyled />
      </A>
      <LogoLinkStyled to="/help">
        <InfoStyled />
      </LogoLinkStyled>
    </SocialLinksContainer>
  </FooterStyled>
);
