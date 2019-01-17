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

import withLayout from './pages/layout';
import PostHelloWorld from './pages/post-hello-world';
import PostReactRouter from './pages/post-react-router';

const PostHelloWorldWithLayout = withLayout(PostHelloWorld);
const PostReactRouterWithLayout = withLayout(PostReactRouter);
// note About page uses the current blog post layout
const AboutWithLayout = withLayout(About);

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts/hello-world" />
        <Route path="/about" component={AboutWithLayout} />
        <Route path="/posts/hello-world" component={PostHelloWorldWithLayout} />
        <Route path="/posts/react-router" component={PostReactRouterWithLayout} />
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
