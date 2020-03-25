import React from 'react';
import { Route, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render } from '@testing-library/react';

// https://codesandbox.io/s/github/kentcdodds/react-testing-library-examples/tree/master/?fontsize=14&module=%2Fsrc%2F__tests__%2Freact-router.js&previewwindow=tests
// this is a handy function that I would utilize for any component
// that relies on the router being in context
export function renderWithRouter(
  ui,
  {
    route = '/',
    history = createMemoryHistory({ initialEntries: [route] }),
    session = {},
    setSession = jest.fn()
  } = {}
) {
  return {
    ...render(<Router history={history}>{ui}</Router>),
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history
  };
}
