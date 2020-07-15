import React, { useEffect, useState } from 'react';

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';

import {
  DARK_MODE_THEME,
  LIGHT_MODE_THEME,
  MIXED_FONT_THEME,
  SANS_FONT_THEME,
} from './common/constants';
import {
  getFont,
  getSession,
  getTheme,
  setFont,
  setTheme,
} from './common/session';

// GLOBAL CSS HERE
import CssVariables from './variables.css';
import CssReset from './reset.css';

import Page404 from './pages/404';
import Signout from './pages/signout';

import EditPost from './pages/edit/components/edit';
import PostList from './pages/post-list';
import SignIn from './pages/signin';
import SignInAdmin from './pages/signin-admin';
import ViewPost from './pages/view-post';
import UserProfile from './pages/user-profile';
import ManagePost from './pages/manage';

export default () => {
  const [session, setSession] = useState(getSession());
  const [theme, setThemeHook] = useState(getTheme());
  const [font, setFontHook] = useState(getFont());

  useEffect(() => {
    if (theme === DARK_MODE_THEME) {
      document.body.classList.add(DARK_MODE_THEME);
    } else {
      document.body.classList.remove(DARK_MODE_THEME);
    }
    if (font === SANS_FONT_THEME) {
      document.body.classList.add(SANS_FONT_THEME);
    } else {
      document.body.classList.remove(SANS_FONT_THEME);
    }
  }, [theme, font]);

  function toggleFont() {
    if (font === SANS_FONT_THEME) {
      setFont(MIXED_FONT_THEME);
      setFontHook(MIXED_FONT_THEME);
      return;
    }
    setFont(SANS_FONT_THEME);
    setFontHook(SANS_FONT_THEME);
  }

  function toggleTheme() {
    if (theme === DARK_MODE_THEME) {
      setTheme(LIGHT_MODE_THEME);
      setThemeHook(LIGHT_MODE_THEME);
      return;
    }
    setTheme(DARK_MODE_THEME);
    setThemeHook(DARK_MODE_THEME);
  }

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
            font={font}
            toggleFont={toggleFont}
            theme={theme}
            toggleTheme={toggleTheme}
            shouldListDrafts={shouldListDrafts}
          />
        )}
      />
    );
  };
  return (
    <>
      <CssVariables />
      <CssReset />

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
            path="/manage/:id"
            component={ManagePost}
            requiresAuth
          />
          <RouteWithSession exact path="/:username" component={UserProfile} />

          <RouteWithSession component={Page404} />
        </Switch>
      </BrowserRouter>
    </>
  );
};
