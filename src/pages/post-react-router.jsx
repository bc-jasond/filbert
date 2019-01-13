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

export default () => (
  <React.Fragment>
    <H1>Adding React Router</H1>
    <SpacerSection/>
    <H2>Pass Routing Responsibilies up to the Browser (React Router)</H2>
    <ContentSection>
      <P>In order to shipped my first blog post, I put all the content directly into <Code>app.jsx</Code>.  This essentially gives me only one route `/`</P>
      <P>Note: if you go to <Code>http://dubaniewi.cz/some/other/route</Code> right now you'll see <Code>Cannot GET /some/other/route</Code>. This response is coming from Express via the <Code>webpack-dev-server</Code> (notice the <Code>X-Powered-By: Express</Code> response header).  In a single-page app (SPA) we'll want to pass routing responsibilities up to the browser so we can use React Router or any other javascript routing library that uses the <A href="https://developer.mozilla.org/en-US/docs/Web/API/History">HTML5 History API</A>.</P>
      <P>Fortunately, this makes for a pretty easy <Code>devServer</Code> config.  Also, it will be a pretty easy <Code>nginx</Code> config later on.</P>
      <P>In <Code>webpack.config.js</Code> we just need to add the following line to the existing <Code>devServer</Code> config:</P>
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
      <P>But it still doesn't work. Now I'm getting 404s for the webpack built assets: <Code>Loading failed for the {'<script>'} with source “http://localhost:8080/some/other/main.da8d74963faaef9b955b.js”.</Code>.  Looks like zero-configuration didn't work for us today and we'll need to add a <Code>rewrites</Code> section</P>
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

    </ContentSection>
  </React.Fragment>
);