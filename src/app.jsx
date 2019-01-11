import React from 'react';
import { hot } from 'react-hot-loader';

import styled from 'styled-components';
import CssReset from './reset.css';
import CssBase, { monospaced } from './common/fonts.css';
import {
  H1,
  H2,
  Ol,
  Li,
  ContentSection,
  CodeSection,
  SpacerSection,
  P,
  Pre,
  A,
  ItalicText,
  Code,
  SiteInfo,
} from './common/shared-styled-components';

const Header = styled.header`
  position: fixed;
  display: block;
  z-index: 500;
  width: 100%;
  background: rgba(255,255,255,.97);
  letter-spacing: 0;
  font-weight: 400;
  font-style: normal;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  top: 0;
`;
const HeaderContentContainer = styled.div`
  position: relative;
  // max-width: 1032px;
  height: 65px;
  padding-left: 20px;
  padding-right: 20px;
  margin: 0 auto;
  justify-content: space-between;
  display: flex;
  align-items: center;
`;
const HeaderLogoSpan = styled.span`
  font-family: ${monospaced}, monospaced;
  font-size: 24px;
  color: rgba(0,0,0,.54);
`;
const HeaderSpacer = styled.div`
  z-index: 100;
  position: relative;
  height: 65px;
`;
const Article = styled.article`
  max-width: 740px;
  padding: 0 20px 80px 20px;
  width: 100%;
  margin: 0 auto;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
`;
const Footer = styled.footer`
  font-family: ${monospaced}, monospaced;
  background: rgba(0,0,0,.05);
  padding: 20px;
  text-align: center;
  color: rgba(0,0,0,.54);
`;

const App = () => (
  <React.Fragment>
    <Header>
      <HeaderContentContainer>
        <HeaderLogoSpan>
          dubaniewi.cz
        </HeaderLogoSpan>
      </HeaderContentContainer>
    </Header>
    <HeaderSpacer />
    <Article>
      <H1>Hello World!</H1>
      <ContentSection>
        <P>{'<Motivation>'}</P>
        <H2>Who?</H2>
        <P>Hi. I'm a software engineer living in the Bay Area. Most recently I've been frontend focused but, I
          love working on APIs, databases, networking and linux, too. I'm also interested in woodworking, build /
          remodel
          projects, biking, classic literature, personal development, songwriting, singing, guitar, bass, drums, piano,
          starting bands &
          playing shows, baking, photography.</P>
        <H2>What?</H2>
        <P>I'm building & writing this blog about software musings & HOWTOs. There's a version of the future where I also write
          about the other topics. As I iterate on the development of this blog
          for <A href="https://rein.pk/finding-product-market-fit">my own</A>&nbsp;
          <A href="https://basecamp.com/books/getting-real">needs</A> (caveat: these 'needs' are artificial; already solved well by other
          offerings) - a blog, a comments section, social integrations for sharing my
          posts, relational data, tenancy (one for each mood, lol -- how will I manage permissions?), etc - It will
          produce writing topics.</P>
        <H2>Why?</H2>
        <P>I decided that I'm not allowing myself to 'just wing it' anymore; not
          thoroughly understanding the technologies in our production systems. 'wing it' has worked for me in the
          past, just GSD. But, inevitably someone, sometime has to go deep to be able to fix the hard bugs. If they don't have the knowledge (likely) then, they need to be willing and committed to attain it. "I don't
          know" has to stop somewhere.</P><P>So, I decided to build this app and write about it as a way to 'do the reps', build
          the habit of deep learning and 'stay in shape' for that task.</P>
        <P>Teaching is the best way to identify gaps in knowledge. <ItalicText>"If you can't explain it simply, you don't understand
          it."</ItalicText><A href="https://en.wikiquote.org/wiki/Talk:Richard_Feynman#Teaching_quote"> -Richard Feynman</A>. I love <A href="https://en.wikiquote.org/wiki/Alan_Kay">Alan Kay's quotes too</A>, find-in-page: Egyptian pyramids. And <A href="https://blog.cleancoder.com/uncle-bob/2017/10/04/CodeIsNotTheAnswer.html">Uncle Bob's 'Clean Code'</A>
        </P>
        <P>On larger projects there can be a lot of fear and uncertainty around changing code critical to the build
          system or core architecture. Over time, that code becomes sacred and the people who wrote it sanctified by the organization.
          Changing that code is risky and often requires a blind 'break and fix' approach and you can only test so much on a local environment. "if it ain't broke
          don't fix it." Software Architecture work doesn't quickly or directly translate into business value so, most of the time
          it's the wrong thing to be working on.</P>
        <P>But, <A href="https://en.wikipedia.org/wiki/Tragedy_of_the_commons">tragedy of the commons</A> is a thing in software development
          (especially in autonomous product-focused teams) and eventually it will impact the business.  So what do you do about it?</P>
        <P>I guess that's the point of side-projects. Make as many mistakes in the toy system as you can. Fix them. Write about it.</P>
        <H2>How?</H2>
        <P>I want to 'start from scratch' with this project so that I get a complete understanding of each step; adding
          new libraries/frameworks/tools/abstractions incrementally when a 'real' need occurs: I can't write the code I need, the
          system can't handle load, I run out of space.</P><P>I'm a beliver in: <Code>let it become a problem.</Code> Because, the opposite is a recipe for a late project where any/every
          foreseeable issue is identified, planned for and solved upfront before any code is written or used in production.</P>
        <P>Don't solve that edge case. Don't support that feature. Don't nest that object. Don't make a list of one
          item. Don't use that framework. Don't create a DSL. Don't make the API 'more flexible' for theoretical future
          requirements. Don't give me a box of Ikea parts and tell me you delivered a dresser.</P>
        <P>Ok, you get the picture ⛪</P>
        <P>{'</Motivation>'}</P>
      </ContentSection>
      <SpacerSection />
      <ContentSection>
        <P>Having a simple React ( + Babel + Webpack + yarn) starter project is actually proving to be difficult
          starting from the documentation. You can always use create-react-app, or TodoMVC if you want to play around
          first. But, I want to start from scratch.</P>
        <P>In my perfect reality, a 'Hello World!' in React should be a matter of:</P>
        <Ol>
          <Li>Go to documentation</Li>
          <Li>copy / paste a simple config</Li>
          <Li>run a command in the terminal</Li>
          <Li>see Hello World</Li>
        </Ol>
        <P>I've listed 3 main libraries - so which do I start with? Which can I do without at first and then iterate
          into?</P>
        <P>Starting with React seems logical, since that's the UI library. Yes, we can develop in ES5 as an exercise in
          'working with constraints' but, personally I like JSX and that depends on Babel. Ok, so just throw
          babel-standalone in the <Code>{'<head>'}</Code> and call it a day. But, quickly we'll see that we
          want to use modules and as of this writing <Code>{'<script type="module">'}</Code> is brittle
          (whitescreen with no errors if you misspell a path to any module anywhere in the tree). I guess we're going to
          want hot reloading too. What's the difference between live and hot reloading?</P>
        <P>Before I dive into Webpack - I probably could/should have used a zero-configuration bundler like Parcel. This
          project would be perfect for it since it's so simple. But, I know webpack so I'll let momentum make my
          decision - Just for Now™️.</P>
        <P>It seems counter intuitive but, I'm going to drive off of Webpack. This isn't so farfetched though - it is
          the asset bundler and require runtime read: the 'framework' (here's a good comparison of these -it's cool to
          see makeas the first tool mentioned, read bottom up for newest tools).</P>
        <P>I found this little online tool in the Webpack documentation which aims to make a pretty simple jump-off
          point for a React project {'https://webpack.jakoblind.no/'}</P>
        <P>Let's see if I can get it working in an 'impatient' amount of time…</P>
        <P>OK, it took about 20 mins including some sips of coffee and looking out the window at Amador City a couple
          times. That's acceptable.</P>
      </ContentSection>
      <SpacerSection />
      <ContentSection>
        <P>During development, I noticed that the builds/reloads take longer than you'd think for a 'hello world!' sized
          app. This is because even though the app code is very small, the 3rd party libs like React get recompiled
          every time a change is detected. Luckily, it's easy enough to <a>add configuration</a> to
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
          <Li>pull down the <a>dubaniewicz-site</a> repo</Li>
          <Li>install yarn - there were apt config issues on my AWS Ubuntu 16 LTS image resolved
            here: <a>https://github.com/yarnpkg/yarn/issues/3189</a></Li>
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
          <Li>See 'Hello World' at <a>http://dubaniewi.cz</a></Li>
          <Li>Profit $$$</Li>
        </Ol>
      </ContentSection>
      <SpacerSection />
      <H2>Basic Layout</H2>
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
        <P>Woah, there are way more fonts and variations than I expected in that file! There's also great hacks in
          Medium's CSS in general:.</P>
        <Ol>
          <Li>rgba black (partially transparent)</Li>
          <Li>font smoothing CSS rules - looks great!</Li>
          <Li>serif <A href="https://github.com/lcdvirgo/bootstrap/tree/master/assets/fonts/%5BFontFont%5D%20Kievit">'Kievit'</A></Li>
          <Li>sans serif <A href="https://practicaltypography.com/charter.html">'Charter'</A></Li>
          <Li><Code>(iLike) => 'source code with === ligatures';</Code>so <A href="https://github.com/tonsky/FiraCode">'Fira
            Mono'</A> for my code please</Li>
        </Ol>
        <P>💡Remember: in your browser developer tools there's a fonts tab to verify loaded fonts (it's a sub-tab under
          the Inspector in Firefox)</P>
        <P>webpack-dev-server was not loading fonts because my config was missing a loader. I added a loader + options
          style config to file-loader to specify a /fonts/ dir as outputPath.</P>
        <P>Facepalm: a typo in a @font-face declaration can prevent the browser from loading a font! I forgot a
          closing <Code>(</Code> in a <Code>{'url(${importName}  '}</Code> statement… lost an hour there 🤦</P>
        <P>I have a basic layout now but, I'm going to add a couple more cleanup items</P>
        <Ol>
          <Li>use a css.js to house reusable CSS constants</Li>
          <Li>use a shared-styled.jsx to house a base set of styled components -although styled-components makes for
            easy duplication of commonly used elements. I want
            to <A href="https://www.toptal.com/designers/ui/ui-styleguide-better-ux">standardize my UI with a style
              guide.</A> This essentially decouples design development from individual page development; improving UX
            consistency and code maintainability. Just 'pick from the catalog' when laying out pages and ignore custom
            designs that arent in the style guide (hehe, sorry designers).</Li>
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
      </ContentSection>
    </Article>
    <Footer>
      🚚 1/4/2019
    </Footer>
    <CssReset />
    <CssBase />
  </React.Fragment>
);

export default App;
export const AppWithHot = hot(module)(App);
