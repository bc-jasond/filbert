import React from 'react';
import ReactDOM from 'react-dom';
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

const Header = styled.header``;
const Article = styled.article``;
const Footer = styled.footer``;

const H1 = styled.h1`
  font-family: ${titleSerif}, serif;
  font-size: 42px;
  line-height: 1.25;
`;
const SomeContent = styled.section`
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -.01em;
`;
const P = styled.p`
  margin-bottom: 16px;
`;
const SomeCode = styled.div`
  display: inline-block;
  font-family: ${monospaced}, monospace;
  font-size: 18px;
  background: rgba(0,0,0,.05);
  padding: 0 4px;
  margin: 0 2px;
`;
const SomeSiteInfo = styled.div`
  display: inline-block;
  font-family: ${sansSerif}, sans-serif;
`;
const SomeItalicText = styled.div`
  display: inline-block;
  font-family: ${italicSerif}, sans-serif;
`;

const App = () => (
  <React.Fragment>
    <Header>
      Header
    </Header>
    <Article>
      <H1>Hello World!!</H1>
      <SomeContent>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast.
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
      Footer
    </Footer>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

const AppWithHot = hot(module)(App);

ReactDOM.render(
  <AppWithHot />,
  document.getElementById('app'),
);
