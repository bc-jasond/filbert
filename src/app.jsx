import React from 'react';
import ReactDOM from 'react-dom';
import { hot } from 'react-hot-loader';

const App = () => (
  <h1>Hello World!</h1>
);

const AppWithHot = hot(module)(App);

ReactDOM.render(
  <AppWithHot />,
  document.getElementById('app'),
);
