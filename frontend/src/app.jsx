import React from 'react';

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { getSession } from './common/session';

// GLOBAL CSS HERE
import CssReset from './reset.css';
import CssBase from './common/fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';

import Discover from './pages/discover';
import EditPost from './pages/edit/components/edit';
import Private from './pages/private';
import SignIn from './pages/signin';
import SignInAdmin from './pages/signin-admin';
import ViewPost from './pages/view-post';
import UserProfile from './pages/user-profile';

export default () => (
  <>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/p" to="/discover" />
        <Redirect push exact from="/" to="/p/homepage" />
        <Redirect push exact from="/help" to="/p/help" />
        <Redirect push exact from="/about" to="/p/about" />
        <Redirect push exact from="/me" to={`/@${getSession()?.username}`} />

        <Route exact path="/signin" component={SignIn} />
        {/* NOTE: signin admin doesn't have a link in, you have to know the url */}
        <Route exact path="/signin-admin" component={SignInAdmin} />
        <Route exact path="/discover" component={Discover} />
        <Route exact path="/private" component={Private} />
        {/* NOTE: view a "published" post - this :canonical is a string like: 'some-url-87ba' */}
        <Route path="/p/:canonical" component={ViewPost} />
        {/* NOTE: this :id is an int like: 34 */}
        <Route path="/edit/:id" component={EditPost} />
        <Route path="/:username" component={UserProfile} />

        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
    <CssPace />
  </>
);
