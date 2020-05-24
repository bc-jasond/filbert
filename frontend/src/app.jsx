import React, { useState } from 'react';

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { getSession } from './common/session';

// GLOBAL CSS HERE
import CssVariables from './variables.css';
import CssReset from './reset.css';
import CssFonts from './fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';
import Signout from './pages/signout';

import EditPost from './pages/edit/components/edit';
import PostList from './pages/post-list';
import SignIn from './pages/signin';
import SignInAdmin from './pages/signin-admin';
import ViewPost from './pages/view-post';
import UserProfile from './pages/user-profile';
import Publish from './pages/publish';

export default React.memo(() => {
  const [session, setSession] = useState(getSession());
  const username = session.get('username');
  const RouteWithSession = ({
    component: Component,
    exact,
    path,
    requiresAuth,
    shouldListDrafts,
  }) => {
    if (requiresAuth && !username) {
      return <Page404 />;
    }
    return (
      <Route
        exact={exact}
        path={path}
        render={({ match: { params = {} }, location: { search } = {} }) => (
          <Component
            params={params}
            queryString={search}
            session={session}
            setSession={setSession}
            shouldListDrafts={shouldListDrafts}
          />
        )}
      />
    );
  };
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Redirect push exact from="/p" to="/public" />
          <Redirect push exact from="/" to="/p/homepage" />
          <Redirect push exact from="/help" to="/p/help" />
          <Redirect push exact from="/about" to="/p/about" />
          {username && <Redirect push exact from="/me" to={`/@${username}`} />}

          <RouteWithSession exact path="/signout" component={Signout} />
          <RouteWithSession exact path="/signin" component={SignIn} />
          {/* NOTE: signin admin doesn't have a link in, you have to know the url */}
          <RouteWithSession
            exact
            path="/signin-admin"
            component={SignInAdmin}
          />
          <RouteWithSession exact path="/public" component={PostList} />
          <RouteWithSession
            exact
            path="/private"
            component={PostList}
            requiresAuth
            shouldListDrafts
          />
          {/* NOTE: view a "published" post - this :canonical is a string like: 'some-url-87ba' */}
          <RouteWithSession exact path="/p/:canonical" component={ViewPost} />
          {/* NOTE: this :id is an int like: 34 */}
          <RouteWithSession
            exact
            path="/edit/:id"
            component={EditPost}
            requiresAuth
          />
          <RouteWithSession
            exact
            path="/publish/:id"
            component={Publish}
            requiresAuth
          />
          <RouteWithSession exact path="/:username" component={UserProfile} />

          <RouteWithSession component={Page404} />
        </Switch>
      </BrowserRouter>
      <CssFonts />
      <CssVariables />
      <CssReset />
      <CssPace />
    </>
  );
});
