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

import PostNginx from './pages/post-nginx';
import PostNginxFirstConfig from './pages/post-nginx-first-config';
import PostDisplayImages from './pages/post-display-images';

import PageLayoutTest from './pages/layout-test';
import blogPostFromJson from './common/blog-content.model';

import aboutData from './data/about.data';
import postsData from './data/posts.data';
import postHelloWorldData from './data/post-hello-world.data';
import postReactRouterData from './data/post-react-router.data';

const testData = postReactRouterData;

async function getPostData(key) {

}

const App = () => (
  <React.Fragment>
    <BrowserRouter>
      <Switch>
        <Redirect push exact from="/" to="/posts/display-images" />
        <Route
          path="/about"
          render={() => (
            // NOTE: About page uses the current blog post layout
            <PageLayoutTest blogPostContent={blogPostFromJson(aboutData)} />
          )}
        />
        <Route
          exact path="/posts"
          render={() => (
            <PageLayoutTest blogPostContent={blogPostFromJson(postsData)} />
          )}
        />
        <Route
          exact path="/posts/hello-world"
          render={() => (
            <PageLayoutTest blogPostContent={blogPostFromJson(postHelloWorldData)} />
          )}
        />
        <Route
          exact path="/posts/react-router"
          render={() => (
            <PageLayoutTest blogPostContent={blogPostFromJson(postReactRouterData)} />
          )}
        />
        <Route
          exact path="/posts/nginx"
          render={() => (
            <PageLayout>
              <PostNginx />
            </PageLayout>
          )}
        />
        <Route
          exact path="/posts/nginx-first-config"
          render={() => (
            <PageLayout>
              <PostNginxFirstConfig />
            </PageLayout>
          )}
        />
        <Route
          exact path="/posts/display-images"
          render={() => (
            <PageLayout>
              <PostDisplayImages />
            </PageLayout>
          )}
        />
        <Route
          exact path="/posts/test"
          render={() => (
            <PageLayoutTest blogPostContent={blogPostFromJson(testData)} />
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
