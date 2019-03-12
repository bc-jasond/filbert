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

import Editor from './pages/editor';
import Page404 from './pages/404';
import PageLayout from './pages/layout';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts/blog-post-content-model" />
        <Redirect push exact from="/about" to="/posts/about" />
        <Redirect push exact from="/posts" to="/posts/all" />
        <Route path="/posts/:id" component={PageLayout} />
        <Route path="/editor" component={Editor}/>
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
