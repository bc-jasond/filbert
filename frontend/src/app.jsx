import React from 'react';

import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { getSession } from './common/session';

// GLOBAL CSS HERE
import CssReset from './reset.css';
import CssBase from './common/fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';
import KThxBye from './pages/kthxbye';

import Public from './pages/public';
import EditPost from './pages/edit/components/edit';
import Private from './pages/private';
import SignIn from './pages/signin';
import SignInAdmin from './pages/signin-admin';
import ViewPost from './pages/view-post';
import UserProfile from './pages/user-profile';
import Publish from './pages/publish';

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
    const username = session.get('username');
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
            <Redirect push exact from="/p" to="/public" />
            <Redirect push exact from="/" to="/p/homepage" />
            <Redirect push exact from="/help" to="/p/help" />
            <Redirect push exact from="/about" to="/p/about" />
            {username && (
              <Redirect push exact from="/me" to={`/@${username}`} />
            )}

            <RouteWithSession exact path="/signout" component={KThxBye} />
            <RouteWithSession exact path="/signin" component={SignIn} />
            {/* NOTE: signin admin doesn't have a link in, you have to know the url */}
            <RouteWithSession
              exact
              path="/signin-admin"
              component={SignInAdmin}
            />
            <RouteWithSession exact path="/public" component={Public} />
            <RouteWithSession exact path="/private" component={Private} />
            {/* NOTE: view a "published" post - this :canonical is a string like: 'some-url-87ba' */}
            <RouteWithSession exact path="/p/:canonical" component={ViewPost} />
            {/* NOTE: this :id is an int like: 34 */}
            <RouteWithSession exact path="/edit/:id" component={EditPost} />
            <RouteWithSession exact path="/publish/:id" component={Publish} />
            <RouteWithSession exact path="/:username" component={UserProfile} />

            <RouteWithSession component={Page404} />
          </Switch>
        </BrowserRouter>
        <CssReset />
        <CssBase />
        <CssPace />
      </>
    );
  }
}
