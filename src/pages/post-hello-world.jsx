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
    <H1>Hello World!</H1>
    <SpacerSection />
    <H2>React Hello World</H2>
    <ContentSection>
      <P>Creating a simple <A href="https://reactjs.org/docs/thinking-in-react.html">React</A> (
        + <A href="https://babeljs.io/docs/en/babel-preset-react">Babel</A> + <A href="https://webpack.js.org/guides/getting-started/">Webpack</A> + <A href="https://yarnpkg.com/en/">yarn</A>)
        starter project is actually proving to be difficult
        starting from the documentation. You can always
        use <A href="https://github.com/facebook/create-react-app">create-react-app</A>,
        or <A href="http://todomvc.com/examples/react/#/">TodoMVC</A> if you want to play around with something more
        opinionated
        first but, I want to start from scratch.</P>
      <P>A 'Hello World!' in React should be a matter of:</P>
      <Ol>
        <Li>Go to documentation</Li>
        <Li>copy / paste a simple config</Li>
        <Li>run a command in the terminal</Li>
        <Li>see Hello World</Li>
      </Ol>
      <P>Of React/Babel/Webpack - which do I start with? Which can I do without at first and then iterate
        into?</P>
      <P><A href="https://reactjs.org/docs/add-react-to-a-website.html">Starting with React</A> seems logical, since
        that's the UI library. Yes, we can develop in ES5 ('working under constraints') but, personally I
        like <A href="https://reactjs.org/docs/introducing-jsx.html">JSX</A> and that depends on Babel. Ok, so just
        throw <A href="https://github.com/babel/babel-standalone">babel-standalone</A> in
        the <Code>{'<head>'}</Code> and call it a day. But, quickly we'll see that we
        want to
        use <A href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import">modules</A> and
        as of this writing <Code>{'<script type="module">'}</Code> is brittle
        (whitescreen with no errors if you misspell a path to any module anywhere in the tree). I guess we're going to
        want <A href="https://github.com/gaearon/react-hot-loader/">hot
          reloading</A> too. <A href="https://stackoverflow.com/a/41429055">What's the difference between live and hot
          reloading?</A></P>
      <P>Before I dive into Webpack - I probably could/should have used a zero-configuration bundler
        like <A href="https://parceljs.org/getting_started.html">Parcel</A>. This
        project would be perfect for it since it's so simple. But, I know webpack so I'll let momentum make my
        decision Just for Now™️.</P>
      <P>It seems counter intuitive but, I'm going to drive off of Webpack. This isn't so farfetched though; it is
        the asset bundler and require runtime - basically our frontend operating system
        (<A href="https://survivejs.com/webpack/appendices/comparison/">here's a good comparison of these</A> - it's
        cool to
        see <Code>make</Code> as the first tool mentioned, read bottom up for newest tools).</P>
      <P>I found <A href="https://webpack.jakoblind.no/">this little online tool</A> in the Webpack documentation
        which aims to make a pretty simple jump-off
        point for a React project</P>
      <P>Let's see if I can get it working in an 'impatient' amount of time…</P>
      <P>OK, it took about 20 mins including some sips of coffee and looking out the window at Amador City. That's
        acceptable.</P>
    </ContentSection>
    <SpacerSection />
    <H2>Build and Deploy to AWS</H2>
    <ContentSection>
      <P>Builds/reloads taking longer than you'd think for a 'hello world!'? This is because the 3rd party libs like
        React get recompiled
        every time a change is detected. Luckily, it's easy enough
        to <A href="https://github.com/bc-jasond/dubaniewicz-site/blob/703bc41850ee945049f5bef265214e8fd4b9bf3e/webpack.config.js#L52">add
          configuration</A> to
        the <Code>webpack.config.js</Code> to split code that comes
        from <Code>/node_modules/</Code> into a separate bundle.</P>
      <P>For the sake of shipping something this week I'm going to add a temporary dev server mode to run 'in
        production' on port 80 on my AWS box.</P>
    </ContentSection>
    <SpacerSection />
    <ContentSection>
      <P>Now, let's build and deploy</P>
      <Ol>
        <Li>SSH into the AWS box</Li>
        <Li>pull down the <A href="https://github.com/bc-jasond/dubaniewicz-site">dubaniewicz-site</A> repo</Li>
        <Li>install yarn - there were <Code>apt</Code> config issues on my AWS Ubuntu 16 LTS
          image <A href="https://github.com/yarnpkg/yarn/issues/3189">resolved
            here:</A></Li>
      </Ol>
    </ContentSection>
    <CodeSection>
      <Pre>$ sudo apt remove cmdtest</Pre>
      <Pre>$ echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list</Pre>
      <Pre>$ sudo apt update && sudo apt install - no-install-recommends yarn</Pre>
      <Pre>$ curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -</Pre>
      <Pre>$ sudo apt update && sudo apt install - no-install-recommends yarn</Pre>
    </CodeSection>
    <ContentSection>
      <Ol>
        <Li>install dependencies <Code>yarn;</Code></Li>
        <Li>build assets. For now this is just <Code>yarn start-prod</Code> make sure the
          webpack <Code>devServer</Code> config section serves at <Code>0.0.0.0</Code> instead
          of the default <Code>localhost</Code> or you'll get Connection Refused</Li>
        <Li>Point <Code>dubaniewi.cz</Code> DNS to AWS box (I'm using the GoDaddy web GUI)</Li>
        <Li>See 'Hello World' at <A href="http://dubaniewi.cz">http://dubaniewi.cz</A></Li>
        <Li>Profit $$$</Li>
      </Ol>
    </ContentSection>
    <SpacerSection />
    <H2>Basic Layout for a Blog</H2>
    <ContentSection>
      <P> for 1st blog post - this will just be the homepage for now.</P>
      <Ol>
        <Li>Header placeholder</Li>
        <Li>Content of first blog post (this one)</Li>
        <Li>Stolen from Medium (and
          essentially <A href="https://github.com/twbs/bootstrap/blob/793b83fda84da33e07adfab467a68dc649565401/scss/mixins/_breakpoints.scss#L5">Bootstrap's
            xs size</A>): I'm going to put all content sections (text,
          images, code blocks, three-dot-spacer, etc.) inside <Code>display: block;</Code> containers. This is
          mobile-first and it
          Just Works™ for all screen sizes: 1 column, stacked block sections with
          padding, <Code>margin-bottom</Code> for spacing in one direction, <Code>max-width</Code> for desktop. Done.
          Basically, no horizontal layout = no responsive layout issues & no edge cases
          (except, maybe flex layout fallbacks for older browsers if I go there).</Li>
        <Li>Medium provides some nice layout constraints: no nesting indents, bullets, pretty awesome.</Li>
        <Li>Footer placeholder</Li>
      </Ol>
    </ContentSection>
    <H2>Nice to haves</H2>
    <ContentSection>
      <P>(let's try our best to deliver these incrementally and not with the next commit AKA never lol):</P>
      <Ol>
        <Li>Homepage that's different from this post page</Li>
        <Li>permalinks</Li>
        <Li>posting categories</Li>
        <Li>sidebar with links to other articles</Li>
        <Li>subscribe link / timed popup</Li>
        <Li>RSS feed</Li>
        <Li>social share links</Li>
        <Li>this list will grow…</Li>
      </Ol>
      <P>I like <A href="https://github.com/MicheleBertoli/css-in-js">CSS-in-JS</A> and I've been
        using <A href="https://www.styled-components.com/">styled-components</A> to much satisfaction. I'll also use
        a <A href="https://meyerweb.com/eric/tools/css/reset/">CSS reset</A> global
        sheet. <A href="https://bitsofco.de/a-look-at-css-resets-in-2018/">What's that?</A></P>
      <P>I had an issue with <Code>yarn add -D styled-components</Code> (probably because of
        a <Code>node</Code> version update from <Code>nvm</Code>). Do a <Code>sudo rm -rf node_modules/</Code> to fix
        this error:</P>
    </ContentSection>
    <CodeSection>
      <Pre>jd@local ~/dev/dubaniewicz-site (master)*$ yarn add -D styled-components</Pre>
      <Pre>yarn add v1.12.3</Pre>
      <Pre>[1/4] 🔍 Resolving packages…</Pre>
      <Pre>warning styled-components > memoize-one@4.1.0: New custom equality api does not play well with all equality helpers. Please use v5.x</Pre>
      <Pre>[2/4] 🚚 Fetching packages…</Pre>
      <Pre>[3/4] 🔗 Linking dependencies…</Pre>
      <Pre>error An unexpected error occurred: "EACCES: permission denied, rmdir '/Users/jd/dev/dubaniewicz-site/node_modules/.cache/terser-webpack-plugin/index-v5/67/b1'".</Pre>
      <Pre>info If you think this is a bug, please open a bug report with the information provided in "/Users/jd/dev/dubaniewicz-site/yarn-error.log".</Pre>
    </CodeSection>
    <ContentSection>
      <P>I'm aiming to use semantic markup where possible
        i.e. <Code>{`<header>`}</Code> vs <Code>{`<div class="header">`}</Code></P>
      <P>I'd like to pick a font: 1 serif for content, 1 sans serif for Titles - just like mama (read: Medium) used to
        make! Here's an example of one of
        Medium's <A href="https://glyph.medium.com/css/e/sr/latin/e/ssr/latin/e/ssb/latin/m2.css">font style
          sheets</A>: 'latin'</P>
      <P>Woah, there are way more fonts and variations than I expected in that file! There's also great CSS tricks in
        Medium's CSS in general:</P>
      <Ol>
        <Li><A href="https://github.com/bc-jasond/dubaniewicz-site/blob/d644e5b5897666d3d6fba2d57489539fcff85fde/src/reset.css.js#L27">rgba
          black</A> (partially transparent)</Li>
        <Li><A href="https://github.com/bc-jasond/dubaniewicz-site/blob/d644e5b5897666d3d6fba2d57489539fcff85fde/src/reset.css.js#L32">font
          smoothing</A> CSS rules - looks great!</Li>
        <Li>serif <A href="https://github.com/lcdvirgo/bootstrap/tree/master/assets/fonts/%5BFontFont%5D%20Kievit">'Kievit'</A></Li>
        <Li>sans serif <A href="https://practicaltypography.com/charter.html">'Charter'</A></Li>
        <Li><Code>(iLike) => 'source code with === ligatures';</Code>so <A href="https://github.com/tonsky/FiraCode">'Fira
          Mono'</A> for my code please</Li>
      </Ol>
      <P>💡Remember: in your browser developer tools there's a fonts tab to verify loaded fonts (it's a sub-tab under
        the Inspector in Firefox)</P>
      <P><Code>webpack-dev-server</Code> was not loading fonts because my config was missing a loader. I added
        a <A href="https://github.com/bc-jasond/dubaniewicz-site/commit/b228decb7e76668d5375123b7d6d368ff85784a8#diff-11e9f7f953edc64ba14b0cc350ae7b9dR21">loader
          + options</A> style config to file-loader to specify a /fonts/ dir as <Code>outputPath</Code></P>
      <P>🤦Facepalm: a typo in a <Code>@font-face</Code> declaration can prevent the browser from loading a font! I
        forgot a
        closing <Code>(</Code> in a statement… lost an hour there</P>
      <P>I have a basic layout now but, I'm going to add a couple more cleanup items</P>
      <Ol>
        <Li>use a <Code>css.js</Code> to house reusable CSS constants</Li>
        <Li>use a <Code>shared-styled.jsx</Code> to house a base set of styled components - although styled-components
          makes for
          easy duplication of commonly used elements. I want
          to <A href="https://www.toptal.com/designers/ui/ui-styleguide-better-ux">standardize my UI with a style
            guide.</A> This essentially decouples design development from individual page development; improving UX
          consistency and code maintainability. Just 'pick from the catalog' when laying out pages and ignore custom
          designs that arent in the style guide (sorry designers).</Li>
      </Ol>
      <P>Tweaking sections - adding and styling a pseudo element in styled-components
        thanks <A href="https://github.com/styled-components/styled-components/issues/388#issuecomment-397132040">worc
          on github</A> and <A href="https://stackoverflow.com/a/20858630">Adrift on Stack Overflow</A></P>
    </ContentSection>
    <CodeSection>
      <Pre>const SomeElement = styled.div`</Pre>
      <Pre>  &::after {'{'}</Pre>
      <Pre>    display: block; // width/height won't work without this because Pseudo elements default to display: inline;</Pre>
      <Pre>    content: '\\00a0'; // won't render without content</Pre>
      <Pre>  {'}'}</Pre>
      <Pre>`;</Pre>
    </CodeSection>
    <ContentSection>
      <P><SiteInfo>There's more to do and more detail to fill in but, I'm out of time.</SiteInfo></P>
      <P>💡Remember: <ItalicText>if you're not embarrassed, then
        you <A href="https://twitter.com/reidhoffman/status/847142924240379904?lang=en">shipped too
          late.</A></ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
  </React.Fragment>
);