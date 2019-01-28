import React from 'react';

import { LinkStyled, H2, Code } from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H2>
      <LinkStyled to="/posts/nginx">Replacing <Code>webpack-dev-server</Code> with <Code>nginx</Code> in Production</LinkStyled>
    </H2>
    <H2>
      <LinkStyled to="/posts/react-router">Intro to React Router</LinkStyled>
    </H2>
    <H2>
      <LinkStyled to="/posts/hello-world">Hello World! React, Babel, Webpack + Medium clone blog starter project</LinkStyled>
    </H2>
  </React.Fragment>
)
