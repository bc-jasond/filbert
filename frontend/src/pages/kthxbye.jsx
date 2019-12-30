import * as React from 'react';
import {
  H1Center,
  StaticFooter
} from '../common/components/layout-styled-components';
import { signout } from '../common/session';
import Header from './header';
import Footer from './footer';

export default ({ session, setSession }) => {
  if (session?.userId) {
    signout();
    setSession({});
  }

  return (
    <>
      <Header />
      <H1Center>
        {"You're logged out "}
        <span role="img" aria-label="hand waving bye">
          👋
        </span>
      </H1Center>
      <StaticFooter>
        <Footer />
      </StaticFooter>
    </>
  );
};
