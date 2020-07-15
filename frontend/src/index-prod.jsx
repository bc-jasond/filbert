import ReactDOM from 'react-dom';
import React from 'react';

import App from './app';

console.debug = () => {};
console.info = () => {};
console.log = () => {};

ReactDOM.render(<App />, document.getElementById('app'));
