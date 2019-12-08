import ReactDOM from 'react-dom';
import React from 'react';

import App from './app';
import { AppWithHot } from './app-hot';

import Pace from './common/pace';

Pace();

if (process.env.isProduction) {
  console.debug = () => {};
  console.info = () => {};
  console.log = () => {};
}

ReactDOM.render(
  process.env.isProduction ? <App /> : <AppWithHot />,
  document.getElementById('app')
);
