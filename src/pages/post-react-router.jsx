import React from 'react';
import {
  A,
  Code, CodeSection,
  ContentSection,
  H1,
  H2,
  ItalicText,
  Li,
  Ol,
  P, Pre, SiteInfo,
  SpacerSection
} from '../common/shared-styled-components';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import Page404 from './404';
import CssReset from '../reset.css';
import CssBase from '../common/fonts.css';

export default () => (
  <React.Fragment>
    <H1>Adding React Router</H1>
    <SpacerSection/>
    <H2>Pass Routing Responsibilies up to the Browser (React Router)</H2>
    <ContentSection>
      <P>In order to shipped my first blog post, I put all the content directly into <Code>app.jsx</Code>.  This essentially gives me only one route `/`</P>
      <P>Note: if you go to <Code>http://dubaniewi.cz/some/other/route</Code> right now you'll see <Code>Cannot GET /some/other/route</Code>. This response is coming from Express via the <Code>webpack-dev-server</Code> (notice the <Code>X-Powered-By: Express</Code> response header).  In a single-page app (SPA) we'll want to pass routing responsibilities up to the browser so we can use React Router or any other javascript routing library that uses the <A href="https://developer.mozilla.org/en-US/docs/Web/API/History">HTML5 History API</A>.</P>
      <P>Fortunately, this makes for a pretty easy <Code>devServer</Code> config.  Also, it will be a pretty easy <Code>nginx</Code> config later on.</P>
      <P>In <Code>webpack.config.js</Code> we just need to add the following line to the existing <Code>devServer</Code> config: <Code>historyApiFallback: true</Code></P>
      <P>💡Remember: changes to <Code>webpack.config.js</Code> require a restart of the <Code>webpack-dev-server</Code>; they won't be detected</P>
      <P>(there are more options available <A href="https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback">link to documentation</A>)</P>
    </ContentSection>
    <CodeSection>
      <Pre>module.exports = (env, argv) => {'{'}</Pre>
      <Pre>  const config = {'{'}</Pre>
      <Pre>    entry: ...,</Pre>
      <Pre>    output: ...,</Pre>
      <Pre>    module: ...,</Pre>
      <Pre>    devServer: {'{'}</Pre>
      <Pre>      contentBase: './dist',</Pre>
      <Pre>      host: '0.0.0.0',</Pre>
      <Pre>      disableHostCheck: true,</Pre>
      <Pre>      historyApiFallback: true, // this will pass all subroutes to the default 'index.html'</Pre>
      <Pre>      port: isProduction ? 80 : 8080,</Pre>
      <Pre>    {'}'},</Pre>
      <Pre>  {'}'}</Pre>
      <Pre>  return config;</Pre>
      <Pre>{'}'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>You can confirm your configuration by looking for <Code>ℹ ｢wds｣: 404s will fallback to /index.html</Code> in the logs of <Code>yarn start</Code></P>
    </ContentSection>
    <CodeSection>
      <Pre>jd@local ~/dev/dubaniewicz-site (post-react-router)*$ yarn start</Pre>
      <Pre>yarn run v1.12.3</Pre>
      <Pre>$ webpack-dev-server --hot --mode development</Pre>
      <Pre>ℹ ｢wds｣: Project is running at http://0.0.0.0:8080/</Pre>
      <Pre>ℹ ｢wds｣: webpack output is served from /</Pre>
      <Pre>ℹ ｢wds｣: Content not from webpack is served from ./dist</Pre>
      <Pre>ℹ ｢wds｣: 404s will fallback to /index.html</Pre>
      <Pre>ℹ ｢wdm｣: Hash: da8d74963faaef9b955b</Pre>
      <Pre>Version: webpack 4.28.2</Pre>
    </CodeSection>
    <ContentSection>
      <P>But it still doesn't work. Now I'm getting 404s for the webpack bundles: <Code>Loading failed for the {'<script>'} with source “http://localhost:8080/some/other/main.da8d74963faaef9b955b.js”.</Code>.  Looks like zero-configuration didn't work for us today and we'll need to add a <Code>rewrites</Code> section</P>
      <P>If you run <Code>yarn build-prod</Code>, you'll see there are currently three types of files: <Code>*.html</Code>, <Code>*.woff</Code>, and <Code>*.js</Code>.  It makes sense to have routing rules for each type of file (and images, too)</P>
      <P>The <A href="https://github.com/bripkens/connect-history-api-fallback">node connect library that <Code>webpack-dev-server</Code> uses</A> allows a <Code>function</Code> to be passed as a <Code>to</Code> parameter of a rewrite object.  This has access to the request and the parsedUrl.  We'll use the <Code>parsedUrl</Code> to get the filename and then do a manual rewrite.</P>
      <P>Once we have <A href="https://github.com/bc-jasond/dubaniewicz-site/commit/e53622f3f63b0e97e19299f49fdafef368688032">rewrites for JS, fonts and, a default</A> for all other routes - we can successfully load our SPA and then handle additional routing with React Router</P>
    </ContentSection>
    <H2>Split Content into Page Components</H2>
    <ContentSection>
      <P>Now it's time to split out content into pages.  The first version of this will be to have a page for this React Router post, the Hello World post and, an About page.</P>
      <P><A href="https://github.com/bc-jasond/dubaniewicz-site/commit/62135405685f5b4eacaad08a3eed3a7298ff3482">Here's the commit</A> that demonstrates a way to do that</P>
      <P>For now, I just imported <Code>PostHelloWorld</Code> into <Code>App</Code> and hard coded it.  Currently, <Code>About</Code> isn't routable.</P>
    </ContentSection>
    <SpacerSection/>
    <H2>Install React Router</H2>
    <ContentSection>
      <P>Installing React Router is straightforward from <A href="https://reacttraining.com/react-router/web/guides/quick-start">the documentation</A></P>
      <P>For this project it's just <Code>yarn add react-router-dom</Code> (which will also install the <Code>react-router</Code> base package.</P>
      <P>So far, this project has the following routes:</P>
      <Ol>
        <Li>Homepage <Code>/</Code></Li>
        <Li>About <Code>/about</Code></Li>
        <Li>Blog Post: Hello World <Code>/posts/hello-world</Code></Li>
        <Li>Blog Post: React Router <Code>/posts/react-router</Code></Li>
        <Li>Not Found <Code>/404</Code></Li>
      </Ol>
      <P>What about the <Code>/posts</Code> base route?  Good question.  I think that would be a great place to list all blog posts in reverse chronological order... Before I do that I'd like to get blog content modelled, data persistence, a proper web server, etc.  But, I suppose I could just create a quick layout and hardcode it for now.  Ok, that's more 'ship it' like.</P>
      <P>With routes defined it's now just a matter of wrapping the <Code>App</Code> component in a <Code>BrowserRouter</Code> component and filling it with <Code>Route</Code> components</P>
      <P>What? I know, it's strange if you're used to assigning strings to <Code>window.location</Code> or handling routing in JS with Angular, etc.  Rendering DOM elements to manipulate the History API is strange at first but, it's actually quite clean and elegant!</P>
    </ContentSection>
    <ContentSection>
      <P>Of course there were some issues with our refactor.</P>
    </ContentSection>
    <H2>Using a HOC Layout Component</H2>
    <ContentSection>
      <P>Motivation: Error: can't use <Code>{'<Link>'}</Code> outside of a <Code>{'<Router>'}</Code></P>
      <P>If you're used to thinking about 'instances' of classes having state and a set of responsibilites and just sharing references to those around, then you'll have an adjustment in your mental model to make in order to have fun with React.  Instead of having many instances of classes that have responsiblities and sharing references, React uses the decorator (composition) pattern: give ONE component all of the functionality it needs by decorating it with 'mixins'.  This leads to ONE state and removes the need for references to other components for communication.  Getting rid of those references greatly reduces asynchronous operation headaches - but, it comes at a cost: more layers of abstraction.  Which is arguably harder to reason about.  I'm still trying to find the balance with this trade-off.</P>
      <P>Here's what <Code>App</Code> JSX looks like now:</P>
    </ContentSection>
    <CodeSection>
      <Pre>{'const App = () => ('}</Pre>
      <Pre>{'  <React.Fragment>'}</Pre>
      <Pre>{'    <BrowserRouter>'}</Pre>
      <Pre>{'      <Switch>'}</Pre>
      <Pre>{'        <Redirect push exact from="/" to="/posts/hello-world" />'}</Pre>
      <Pre>{'        <Route path="/about" component={AboutWithLayout} />'}</Pre>
      <Pre>{'        <Route path="/posts/hello-world" component={PostHelloWorldWithLayout} />'}</Pre>
      <Pre>{'        <Route path="/posts/react-router" component={PostReactRouterWithLayout} />'}</Pre>
      <Pre>{'        <Route component={Page404} />'}</Pre>
      <Pre>{'      </Switch>'}</Pre>
      <Pre>{'    </BrowserRouter>'}</Pre>
      <Pre>{'    <CssReset />'}</Pre>
      <Pre>{'    <CssBase />'}</Pre>
      <Pre>{'  </React.Fragment>'}</Pre>
      <Pre>{');'}</Pre>
    </CodeSection>

  </React.Fragment>
);