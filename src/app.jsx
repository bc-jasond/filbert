import React from 'react';
import ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';

import styled from 'styled-components';
import CssReset from './reset.css';

const Header = styled.header``;
const Article = styled.article``;
const Footer = styled.footer``;

const H1 = styled.h1``;

const App = () => (
  <React.Fragment>
    <Header>
      Header
    </Header>
    <Article>
      <H1>Hello World!!</H1>
    </Article>
    <Footer>
      Footer
    </Footer>
    <CssReset/>
  </React.Fragment>
);

const AppWithHot = hot(module)(App);

ReactDOM.render(
  <AppWithHot />,
  document.getElementById('app'),
);
