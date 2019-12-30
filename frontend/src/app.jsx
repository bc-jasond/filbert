import React from 'react';

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { getSession } from './common/session';

// GLOBAL CSS HERE
import CssReset from './reset.css';
import CssBase from './common/fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';
import KThxBye from './pages/kthxbye';

import Discover from './pages/discover';
import EditPost from './pages/edit/components/edit';
import Private from './pages/private';
import SignIn from './pages/signin';
import SignInAdmin from './pages/signin-admin';
import ViewPost from './pages/view-post';
import UserProfile from './pages/user-profile';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      session: getSession(),
      setSession: session => {
        this.setState({ session });
      }
    };
  }

  render() {
    const {
      state: { session, setSession }
    } = this;
    const RouteWithSession = ({ component: Component, exact, path }) => {
      return (
        <Route
          exact={exact}
          path={path}
          render={({ match: { params = {} } }) => (
            <Component
              params={params}
              session={session}
              setSession={setSession}
            />
          )}
        />
      );
    };
    return (
      <>
        <BrowserRouter>
          <Switch>
            <Redirect push exact from="/p" to="/discover" />
            <Redirect push exact from="/" to="/p/homepage" />
            <Redirect push exact from="/help" to="/p/help" />
            <Redirect push exact from="/about" to="/p/about" />
            <Redirect
              push
              exact
              from="/me"
              to={`/@${this.state?.session?.username}`}
            />

            <RouteWithSession exact path="/signout" component={KThxBye} />
            <RouteWithSession exact path="/signin" component={SignIn} />
            {/* NOTE: signin admin doesn't have a link in, you have to know the url */}
            <RouteWithSession
              exact
              path="/signin-admin"
              component={SignInAdmin}
            />
            <RouteWithSession exact path="/discover" component={Discover} />
            <RouteWithSession exact path="/private" component={Private} />
            {/* NOTE: view a "published" post - this :canonical is a string like: 'some-url-87ba' */}
            <RouteWithSession path="/p/:canonical" component={ViewPost} />
            {/* NOTE: this :id is an int like: 34 */}
            <RouteWithSession path="/edit/:id" component={EditPost} />
            <RouteWithSession path="/:username" component={UserProfile} />

            <Route component={Page404} />
          </Switch>
        </BrowserRouter>
        <CssReset />
        <CssBase />
        <CssPace />
      </>
    );
  }
}
