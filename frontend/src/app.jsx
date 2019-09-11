import React from 'react';
import { hot } from 'react-hot-loader';

import {
  BrowserRouter,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';

// GLOBAL CSS HERE
import CssReset from './reset.css';
import CssBase from './common/fonts.css';
import CssPace from './common/pace.css';

import Page404 from './pages/404';
import PageLayout from './pages/layout';
import ListAllPosts from './pages/list-all-posts';
import ListAllDrafts from './pages/list-all-drafts';
import ViewPost from './pages/view-post';
import SignIn from './pages/signin';
import EditPost from './pages/edit/edit';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts" />
        <Redirect push exact from="/about" to="/posts/about" />
        <Route exact path="/signin" component={SignIn} />
        <Route exact path="/posts" render={(props) => (
          <PageLayout>
            <ListAllPosts key={props.match.url} />
          </PageLayout>
        )} />
        <Route exact path="/drafts" render={(props) => (
          <PageLayout>
            <ListAllDrafts key={props.match.url} />
          </PageLayout>
        )} />
        {/*NOTE: this :id is a string like 'some-url-87ba'*/}
        <Route path="/posts/:canonical" render={(props) =>
          (
            // https://stackoverflow.com/a/49441836/1991322
            // changing the 'key' prop will cause the component to unmount and therefore reload data for new blog post id
            <PageLayout key={props.match.params.canonical} postCanonical={props.match.params.canonical} {...props}>
              <ViewPost postCanonical={props.match.params.canonical} />
            </PageLayout>
          )}
        />
        {/*NOTE: this :id is an int like 34*/}
        <Route path="/edit/:id" render={(props) =>
          (
            <PageLayout key={props.match.params.id} postId={props.match.params.id} {...props}>
              <EditPost postId={props.match.params.id} />
            </PageLayout>
          )}
        />
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
