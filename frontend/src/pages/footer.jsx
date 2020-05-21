import React from 'react';
import styled from 'styled-components';
import GitHubSvg from '../../assets/icons/github-mark.svg';
import InfoSvg from '../../assets/icons/info.svg';
import {
  ALayout,
  LogoLinkStyled,
  SocialIcon,
} from '../common/components/layout-styled-components';
import { codeFontFamily, getVar, grey, lightGrey } from '../variables.css';

const GitHubStyled = styled(GitHubSvg)`
  cursor: pointer;
  ${SocialIcon};
`;
const InfoStyled = styled(InfoSvg)`
  cursor: pointer;
  ${SocialIcon};
`;
const SocialLinksContainer = styled.div`
  display: flex;
  justify-content: center;
`;
const FooterStyled = styled.footer`
  font-family: ${getVar(codeFontFamily)}, monospaced;
  background: ${lightGrey};
  padding: 20px;
  text-align: center;
  color: ${grey};
`;
const Br = styled.div`
  margin: 16px;
`;
const HelpLink = styled(LogoLinkStyled)`
  flex-grow: unset;
`;

export default React.memo(() => (
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
));
