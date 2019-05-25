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
import ListAllPosts from './pages/list-all-posts';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts" />
        <Redirect push exact from="/about" to="/posts/about" />
        <Route exact path="/posts" component={ListAllPosts} />
        <Route path="/posts/:id" render={(props) =>
          (
            // https://stackoverflow.com/a/49441836/1991322
            // changing the 'key' prop will cause the component to unmount and therefore reload data for new blog post id
            <PageLayout key={props.match.params.id} {...props} />
          )}
        />
        <Route path="/editor" component={Editor} />
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
