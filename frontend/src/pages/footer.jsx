import React from 'react';
import styled from 'styled-components';
import {
  ALayout,
  FooterStyled,
  GitHubStyled,
  InfoStyled,
  LogoLinkStyled,
  SocialLinksContainer,
} from '../common/components/layout-styled-components';

const Br = styled.div`
  margin: 16px;
`;
const HelpLink = styled(LogoLinkStyled)`
  flex-grow: unset;
`;

export default () => (
  <FooterStyled>
    <span role="img" aria-label="truck">
      🚚
    </span>{' '}
    1/4/2020 some-hash-here-34df
    <Br />
    <span role="img" aria-label="baby">
      👶
    </span>{' '}
    1/4/2019
    <SocialLinksContainer>
      <ALayout href="https://github.com/bc-jasond/filbert">
        <GitHubStyled />
      </ALayout>
      <HelpLink to="/help">
        <InfoStyled />
      </HelpLink>
    </SocialLinksContainer>
  </FooterStyled>
);
