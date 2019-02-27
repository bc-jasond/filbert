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

import Page404 from './pages/404';

import PageLayout from './pages/layout';
import blogPostFromJson from './common/blog-content.model';

import aboutData from './data/about.data';
import postsData from './data/posts.data';
import postHelloWorldData from './data/post-hello-world.data';
import postReactRouterData from './data/post-react-router.data';
import postNginxData from './data/post-nginx.data';
import postNginxFirstConfigData from './data/post-nginx-first-config.data';
import postDisplayImagesData from './data/post-display-images.data';

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts/display-images" />
        <Route
          path="/about"
          render={() => (
            // NOTE: About page uses the current blog post layout
            <PageLayout blogPostContent={blogPostFromJson(aboutData)} />
          )}
        />
        <Route
          exact path="/posts"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postsData)} />
          )}
        />
        <Route
          exact path="/posts/hello-world"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postHelloWorldData)} />
          )}
        />
        <Route
          exact path="/posts/react-router"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postReactRouterData)} />
          )}
        />
        <Route
          exact path="/posts/nginx"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postNginxData)} />
          )}
        />
        <Route
          exact path="/posts/nginx-first-config"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postNginxFirstConfigData)} />
          )}
        />
        <Route
          exact path="/posts/display-images"
          render={() => (
            <PageLayout blogPostContent={blogPostFromJson(postDisplayImagesData)} />
          )}
        />
        <Route component={Page404} />
      </Switch>
    </BrowserRouter>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
