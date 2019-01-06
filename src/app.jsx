import React from 'react';
import { hot } from 'react-hot-loader';

import styled from 'styled-components';
import CssReset from './reset.css';
import CssBase, { monospaced } from './common/fonts.css';
import {
  H1,
  ContentSection,
  SpacerSection,
  P,
  ItalicText,
  SourceCode,
  SiteInfo,
} from './common/shared-styled-components';

const Header = styled.header`
  position: fixed;
  display: block;
  z-index: 500;
  width: 100%;
  background: rgba(255,255,255,.97);
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  top: 0;
`;
const HeaderContentContainer = styled.div`
  position: relative;
  // max-width: 1032px;
  height: 65px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto;
  justify-content: space-between;
  display: flex;
  align-items: center;
`;
const HeaderLogoSpan = styled.span`
  font-family: ${monospaced}, monospaced;
  font-size: 24px;
  color: rgba(0,0,0,.54);
`;
const HeaderSpacer = styled.div`
  z-index: 100;
  position: relative;
  height: 65px;
`;
const Article = styled.article`
  max-width: 740px;
  padding: 0 20px 80px 20px;
  width: 100%;
  margin: 0 auto;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
`;
const Footer = styled.footer`
  font-family: ${monospaced}, monospaced;
  background: rgba(0,0,0,.05);
  padding: 20px;
  text-align: center;
  color: rgba(0,0,0,.54);
`;

const App = () => (
  <React.Fragment>
    <Header>
      <HeaderContentContainer>
        <HeaderLogoSpan>
          dubaniewi.cz
        </HeaderLogoSpan>
      </HeaderContentContainer>
    </Header>
    <HeaderSpacer />
    <Article>
      <H1>Hello World!!</H1>
      <ContentSection>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast. [2/4] 🚚 Fetching packages…
        </P>
        <P>
          <ItalicText>
            Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
            activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
            banh mi cred selvage green juice four dollar toast.
          </ItalicText>
        </P>
        <P>
          <SourceCode>() => 'source code with === ligatures';</SourceCode>
        </P>
        <P>
          <SiteInfo>Here's some site info here</SiteInfo>
        </P>
      </ContentSection>
      <SpacerSection/>
      <ContentSection>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast. [2/4] 🚚 Fetching packages…
        </P>
        <P>
          <ItalicText>
            Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
            activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
            banh mi cred selvage green juice four dollar toast.
          </ItalicText>
        </P>
        <P>
          <SourceCode>() => 'source code with === ligatures';</SourceCode>
        </P>
        <P>
          <SiteInfo>Here's some site info here</SiteInfo>
        </P>
      </ContentSection>
    </Article>
    <Footer>
      🚚 1/4/2019
    </Footer>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
