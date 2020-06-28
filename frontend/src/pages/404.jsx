import * as React from 'react';
import {
  H1Center,
  StaticFooter,
} from '../common/components/layout-styled-components';
import Header from './header';
import Footer from './footer';

export default ({ session, font, toggleFont, theme, toggleTheme }) => (
  <>
    <Header
      session={session}
      font={font}
      toggleFont={toggleFont}
      theme={theme}
      toggleTheme={toggleTheme}
    />
    <H1Center id="error-message">
      404 Not Found{' '}
      <span role="img" aria-label="girl shrug">
        🤷🏻‍♀️
      </span>
    </H1Center>
    <StaticFooter>
      <Footer />
    </StaticFooter>
  </>
);
