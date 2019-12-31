import React from 'react';
import styled from 'styled-components';
import {
  A,
  FooterStyled,
  GitHubStyled,
  InfoStyled,
  LinkedInStyled,
  LogoLinkStyled,
  SocialLinksContainer
} from '../common/components/layout-styled-components';

const HelpLink = styled(LogoLinkStyled)`
  flex-grow: unset;
`;

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
      <HelpLink to="/help">
        <InfoStyled />
      </HelpLink>
    </SocialLinksContainer>
  </FooterStyled>
);
