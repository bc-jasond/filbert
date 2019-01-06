import React from 'react';
import { hot } from 'react-hot-loader';

import styled from 'styled-components';
import CssReset from './reset.css';
import CssBase, {
  titleSerif,
  contentSerif,
  monospaced,
  sansSerif,
  italicSerif,
} from './base.css';

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
const H1 = styled.h1`
  font-family: ${titleSerif}, serif;
  font-size: 42px;
  line-height: 1.25;
  margin-bottom: 24px;
`;
const SomeContent = styled.section`
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -.01em;
  margin-bottom: 40px;
`;
const Spacer = styled(SomeContent)`
  line-height: 0;
  &::after {
    content: '\\00a0';
    display: block;
    margin: 0 auto;
    border-bottom: 1px solid rgba(0,0,0,.24);
    width: 88px;
  }
`;
const P = styled.p`
  margin-bottom: 16px;
`;
const SomeCode = styled.code`
  display: inline-block;
  font-family: ${monospaced}, monospace;
  font-size: 18px;
  background: rgba(0,0,0,.05);
  padding: 0 4px;
  margin: 0 2px;
`;
const SomeSiteInfo = styled.span`
  display: inline-block;
  font-family: ${sansSerif}, sans-serif;
`;
const SomeItalicText = styled.span`
  display: inline-block;
  font-family: ${italicSerif}, sans-serif;
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
      <SomeContent>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast. [2/4] 🚚 Fetching packages…
        </P>
        <P>
          <SomeItalicText>
            Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
            activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
            banh mi cred selvage green juice four dollar toast.
          </SomeItalicText>
        </P>
        <P>
          <SomeCode>() => 'source code with === ligatures';</SomeCode>
        </P>
        <P>
          <SomeSiteInfo>Here's some site info here</SomeSiteInfo>
        </P>
      </SomeContent>
      <Spacer/>
      <SomeContent>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast. [2/4] 🚚 Fetching packages…
        </P>
        <P>
          <SomeItalicText>
            Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
            activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
            banh mi cred selvage green juice four dollar toast.
          </SomeItalicText>
        </P>
        <P>
          <SomeCode>() => 'source code with === ligatures';</SomeCode>
        </P>
        <P>
          <SomeSiteInfo>Here's some site info here</SomeSiteInfo>
        </P>
      </SomeContent>
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
