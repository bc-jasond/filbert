import React from 'react';
import {
  A,
  LinkStyled,
  Code,
  CodeSection,
  ContentSection,
  H1,
  H2,
  Li,
  Ol,
  P,
  Pre,
  SpacerSection,
  ItalicText, SiteInfo,
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>Adding React Router</H1>
    <SpacerSection/>
    <H2>Pass Routing Responsibilies up to the Browser (React Router)</H2>
    <ContentSection>
      <P>In order to ship <LinkStyled to="/posts/hello-world">my first blog post</LinkStyled>, I put all the content directly into <Code>app.jsx</Code>.  This essentially gave me only one route: <Code>/</Code></P>
      <P>Note: if you go to <Code>http://dubaniewi.cz/some/other/route</Code> <A href="https://github.com/bc-jasond/dubaniewicz-site/commit/faff0ffcda6b674e9483ce35af2dbae5500a8742">as of this commit</A> you'll see <Code>Cannot GET /some/other/route</Code>. This response is coming from Express via the <Code>webpack-dev-server</Code> (notice the <Code>X-Powered-By: Express</Code> response header).  In a single-page app (SPA) we'll want to pass routing responsibilities up to the browser so we can use <A href="https://reacttraining.com/react-router/web/guides/quick-start">React Router</A> or any other javascript routing library that uses the <A href="https://developer.mozilla.org/en-US/docs/Web/API/History">HTML5 History API</A>.</P>
      <P>Fortunately, this makes for a pretty easy <Code>devServer</Code> config - forward all requests to one route.  This will also be a pretty easy <Code>nginx</Code> config later on.</P>
      <P>In <Code>webpack.config.js</Code> we just need to add the following line to the existing <Code>devServer</Code> config: <Code>historyApiFallback: true</Code> (there are more <Code>devServer</Code> options available <A href="https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback">link to documentation</A>)</P>
      <P>💡Remember: changes to <Code>webpack.config.js</Code> require a restart of the <Code>webpack-dev-server</Code>; they won't be detected</P>
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
      <P>But it still doesn't work. Now I'm getting 404s for the webpack bundles: <Code>Loading failed for the {'<script>'} with source “http://localhost:8080/some/other/main.da8d74963faaef9b955b.js”</Code>  Looks like a zero-configuration <Code>devServer</Code> didn't work for us today and we'll need to add a <Code>rewrites</Code> section</P>
      <P>If you run <Code>yarn build-prod</Code>, you'll see there are currently three types of build artifacts: <Code>*.html</Code>, <Code>*.woff</Code>, and <Code>*.js</Code>.  It makes sense to have routing rules for each type of file (and later images, too).  Yes, we could have one routing rule and let the filesystem (directory structure) organize the different types of files but, it doesn't hurt to be explicit.</P>
      <P>The <A href="https://github.com/bripkens/connect-history-api-fallback">node connect library that <Code>webpack-dev-server</Code> uses</A> allows a <Code>function</Code> to be passed as a <Code>to</Code> parameter of a rewrite object.  This has access to the request and the <Code>parsedUrl</Code>.  We'll use the <Code>parsedUrl</Code> to get the filename and then do a manual rewrite.</P>
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
      <P>What? I know, this <ItalicText>Declarative</ItalicText> routing is strange if you're used to assigning strings to <Code>window.location</Code> or ui-router from angular.js 1.x.  Rendering DOM elements to manipulate the History API is strange at first but, it's actually quite clean and elegant!</P>
    </ContentSection>
    <ContentSection>
      <P>Of course there were some issues with our refactor.</P>
    </ContentSection>
    <H2>(Re)using a Layout Component</H2>
    <ContentSection>
      <P>Motivation: Error: can't use <Code>{'<Link>'}</Code> outside of a <Code>{'<Router>'}</Code>.  I wanted to put <Code>{'<Route>s'}</Code> inside my styled <Code>{'<Article'}></Code> component because I had a basic layout with a header and footer that I didn't want to cut-n-paste into each page.  But, I also wanted to put a link to <Code>/</Code> in the <Code>{'<Header>'}</Code> logo.  Error.  <Code>{'<Link>'}</Code> takes props passed down from <Code>{'<Router>'}</Code> and it complained that no props were found...</P>
      <P>Hmm, so how do I share markup down to child components so I can:</P>
      <Ol>
        <Li>Wrap a <Code>Page</Code> with <Code>Layout</Code>; so I can then</Li>
        <Li>Wrap the <Code>PageWithLayout</Code> with the <Code>BrowserRouter</Code>; so I can then</Li>
        <Li>use the React Router components anywhere on the page.</Li>
      </Ol>
      <P>So far, I know of three ways to do it:</P>
      <Ol>
        <Li><Code>props.children</Code> - or just any old <Code>props</Code>. Render some markup, then inside of a container(s) render the props like: <Code>{'{props.children}'}</Code> or <Code>{'{props.someOtherPropName}'}</Code>.  Here's an explanation <A href="https://reactjs.org/docs/composition-vs-inheritance.html">from the React documentation</A></Li>
        <Li><A href="https://reactjs.org/docs/higher-order-components.html">Higher Order Components</A> (HOCs for short) - or Components that 'wrap' other components and add (decorate) functionality by passing props to the inner component.  As an exercise, we'll use this pattern next. </Li>
        <Li><A href="https://reactjs.org/docs/render-props.html">Render Props</A> - a component that takes it's <Code>render()</Code> function as a <Code>prop</Code> instead of defining it's own.  This is arguably the most confusing pattern to the newcomer because each component with a Render prop creates another <A href="https://en.wikipedia.org/wiki/Indirection">Layer of Indirection (or abstraction)</A>.  But, it's a powerful patter that I'll explore after HOCs</Li>
      </Ol>
      <P>Right now, there's no state to share just some markup.  This is easily achieved with the first pattern of passing child components as <Code>props</Code>.  So, that's what we'll do!</P>
      <P>💡Remember: In the beginning, all of your problems will come from overusing code-sharing concepts like HOCs and Render props.  So, if you can stick to props and <A href="https://reactjs.org/docs/thinking-in-react.html#step-3-identify-the-minimal-but-complete-representation-of-ui-state">follow this exercise to identify 'The Minimal (but complete) Representation of state'</A> you can avoid problems created by solving problems that you don't have.</P>
      <P>If you're used to an Imperative mental model of programming like me, React, Functional Programming and the Declarative model will take some time to get used to.  I believe that Imperative programming is easier to think about because it's more direct and less abstract.  But, it's also what I know - maybe that's why it's easier 🤷.</P>
      <P>Be that as it may, React is not designed around the Imperative programming model and so let's not fight it.  The new concepts can be introduced slowly while still getting things done.  <Code>props</Code> and <A href="https://reactjs.org/docs/handling-events.html">Event Handlers</A> will take us far.  The biggest trade-off will be writing more 'boilerplate' code to communicate between components.  That code is easy to reason about though, and if it stays consistent it will be easy to refactor with slick functional techniques later on.</P>
      <P>Here's what <Code>App</Code> JSX looks like now:</P>
    </ContentSection>
    <CodeSection>
      <Pre>{'const App = () => ('}</Pre>
      <Pre>{'  <React.Fragment>'}</Pre>
      <Pre>{'    <BrowserRouter>'}</Pre>
      <Pre>{'      <Switch>'}</Pre>
      <Pre>{'        <Redirect push exact from="/" to="/posts/hello-world" />'}</Pre>
      <Pre>{'        <Route'}</Pre>
      <Pre>{'          path="/about"'}</Pre>
      <Pre>{'          render={() => ('}</Pre>
      <Pre>{'            <PageLayout>'}</Pre>
      <Pre>{'              <About />'}</Pre>
      <Pre>{'            </PageLayout>'}</Pre>
      <Pre>{'          )}'}</Pre>
      <Pre>{'        />'}</Pre>
      <Pre>{'        <Route'}</Pre>
      <Pre>{'          path="/posts/hello-world"'}</Pre>
      <Pre>{'          render={() => ('}</Pre>
      <Pre>{'            <PageLayout>'}</Pre>
      <Pre>{'              <PostHelloWorld />'}</Pre>
      <Pre>{'            </PageLayout>'}</Pre>
      <Pre>{'          )}'}</Pre>
      <Pre>{'        />'}</Pre>
      <Pre>{'        <Route'}</Pre>
      <Pre>{'          path="/posts/react-router"'}</Pre>
      <Pre>{'          render={() => ('}</Pre>
      <Pre>{'            <PageLayout>'}</Pre>
      <Pre>{'              <PostReactRouter />'}</Pre>
      <Pre>{'            </PageLayout>'}</Pre>
      <Pre>{'          )}'}</Pre>
      <Pre>{'        />'}</Pre>
      <Pre>{'        <Route component={Page404} />'}</Pre>
      <Pre>{'      </Switch>'}</Pre>
      <Pre>{'    </BrowserRouter>'}</Pre>
      <Pre>{'    <CssReset />'}</Pre>
      <Pre>{'    <CssBase />'}</Pre>
      <Pre>{'  </React.Fragment>'}</Pre>
      <Pre>{');'}</Pre>
    </CodeSection>
    <ContentSection>
      <P>Hey, looks like React Router uses Render props... yep, those are render props up there.  <A href="https://github.com/ReactTraining/react-router/blob/3d233bf0b6dd5bf68d9bac9c94273ae25646b207/packages/react-router/modules/Route.js#L113">here's a link to the source if you're interested</A></P>
      <P>💡Remember: Woah!  I just noticed that Hot Module Reloading wasn't working.  I thought it was related to the new React Router implementation or my <Code>webpack.config.js</Code> but, a quick search yielded this gem of wisdom:</P>
      <P><Code>{'<base href="/" /> <!-- this was missing in the <head> of my index.html!!!-->'}</Code></P>
      <P>Thanks a lot <A href="https://github.com/lekhnath">lekhnath</A> for posting <A href="https://github.com/gaearon/react-hot-loader/issues/620#issuecomment-321729281">this in an issue on github</A></P>
    </ContentSection>
    <SpacerSection />
    <ContentSection>
      <P><SiteInfo>That feels like a pretty clean break point.  The app now supports multiple routes and reusable markup and we only needed to add one library: React Router</SiteInfo></P>
      <P>💡Remember: <ItalicText><A href="https://blog.cleancoder.com/uncle-bob/2015/08/06/LetTheMagicDie.html">Before you commit to a framework, make sure you could write it.</A></ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
  </React.Fragment>
);