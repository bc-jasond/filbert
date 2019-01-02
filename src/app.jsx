import React from 'react';
import ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';

import styled from 'styled-components';

const H1 = styled.h1``;

const App = () => (
  <H1>Hello World!!</H1>
);

const AppWithHot = hot(module)(App);

ReactDOM.render(
  <AppWithHot />,
  document.getElementById('app'),
);
