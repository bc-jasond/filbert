import React from 'react';
import { hot } from 'react-hot-loader';

import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';

// GLOBAL CSS HERE
import CssReset from './reset.css';
import CssBase from './common/fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';
import ListAllPosts from './pages/list-all-posts';
import ListAllDrafts from './pages/list-all-drafts';
import ViewPost from './pages/view-post';
import SignIn from './pages/signin';
import EditPost from './pages/edit/components/edit';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts" />
        <Redirect push exact from="/about" to="/posts/about" />
        <Route exact path="/signin" component={SignIn} />
        <Route exact path="/posts" component={ListAllPosts} />
        <Route exact path="/drafts" component={ListAllDrafts} />
        {/*NOTE: this :canonical is a string like 'some-url-87ba'*/}
        <Route path="/posts/:canonical" component={ViewPost} />
        {/*NOTE: this :id is an int like 34*/}
        <Route path="/edit/:id" component={EditPost} />
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
    <CssPace />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
