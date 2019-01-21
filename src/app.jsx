import React from 'react';
import { hot } from 'react-hot-loader';

import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';

import CssReset from './reset.css';
import CssBase from './common/fonts.css';

import About from './pages/about';
import Page404 from './pages/404';

import PageLayout from './pages/layout';
import PostList from './pages/posts';
import PostHelloWorld from './pages/post-hello-world';
import PostReactRouter from './pages/post-react-router';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts/react-router" />
        <Route
          path="/about"
          render={() => (
            // NOTE: About page uses the current blog post layout
            <PageLayout>
              <About />
            </PageLayout>
          )}
        />
        <Route
          exact path="/posts"
          render={() => (
            <PageLayout>
              <PostList />
            </PageLayout>
          )}
        />
        <Route
          path="/posts/hello-world"
          render={() => (
            <PageLayout>
              <PostHelloWorld />
            </PageLayout>
          )}
        />
        <Route
          path="/posts/react-router"
          render={() => (
            <PageLayout>
              <PostReactRouter />
            </PageLayout>
          )}
        />
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
