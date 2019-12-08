import ReactDOM from 'react-dom';
import React from 'react';

import App from './app';

import Pace from './common/pace';

Pace();

console.debug = () => {};
console.info = () => {};
console.log = () => {};

ReactDOM.render(<App />, document.getElementById('app'));
