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
  SpacerSection,
  P,
  ItalicText,
  SourceCode,
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
        <P>Hi. I'm 37 year old software engineer living in the Bay Area. Most recently I've been frontend focused but, I love working on APIs, databases, networking and linux, too. I'm starting this blog about software musings & HOWTOs. I'll also probably write about these topics (or not): woodworking, build / remodel projects, biking, Classic literature, Personal development, Songwriting, singing, guitar, bass, drums, piano, starting bands & playing shows, recipes / baking  - probably Tuscan or pizza, photography.</P>
        <H2>What?</H2>
        <P>How will my blog be useful? I'd like to believe that as I iterate on this blog for my own needs (insert Segment.io story about analytics.js) - a blog, a comments section, social oauth2 integrations for sharing my posts, relational data, tenancy (one for each mood, lol jk, not sure here but, it's fun to tinker with), etc. - it will naturally become something useful for others.</P>
        <H2>Why?</H2>
        <P>As a Lead/Staff/Principal level product engineer, I'm not allowing myself to 'just ship product' anymore; not thoroughly understanding how all of the technologies work in our production systems. This has worked in the past, just GSD. But, at scale someone has to have the depth of knowledge to be able  to fix the hard bugs. And, if they don't have the knowledge (likely) then they need to be willing and committed to attain it. "I don't know." isn't acceptable. So, I decided to build this app and write about it as a way to 'do the reps', build the habit and 'stay in shape' for that task.</P>
        <P>Teaching is the best way to identify gaps in knowledge. "If you can't explain it simply, you don't understand it." -Richard Feynman.  I love reading Alan Kay's quotes too, find-in-page: Egyptian pyramids. And Uncle Bob https://blog.cleancoder.com/uncle-bob/2017/10/04/CodeIsNotTheAnswer.html</P>
        <P>On larger projects there can be a lot of fear and uncertainty around changing code critical to the build system or core architecture. That code is sacred after all and it was written by special people who have been sanctified by the organization. This fear is mostly due to lack of understanding - an understanding that can only come from destruction and resurrection. Oops, there goes my job. If not so severe, "if it ain't broke don't fix it." Architecture doesn't quickly or directly translate into business value so,  most of the time it's the wrong thing to be working on.</P>
        <P>But, tragedy of the commons https://en.wikipedia.org/wiki/Tragedy_of_the_commons is a thing (especially in autonomous product focused teams)  and eventually it DOES cost the business. Of course, when that happens the people who wrote and understand it will be long gone. And there aren't any tests. So what do we do?</P>
        <P>Enter side-projects -'do the reps'. Break the toy system! Fix it! Write about it! Keep your job! Or not!</P>
        <H2>How?</H2>
        <P>I want to 'start from scratch' with this project so that I get a complete understanding of each step; adding new libraries/frameworks/tools/abstractions only when a 'real' need occurs: I can't write the code I need, the system can't handle load, I run out of space. Too often, I see 'plan for every edge case upfront' where any foreseeable issue is identified and planned for before any code is written or used in production.</P>
        <P>Don't solve that edge case. Don't support that feature. Don't nest that object. Don't make a list of one item. Don't use that framework. Don't create a DSL. Don't make the API 'more flexible' for theoretical future requirements. Don't give me a box of Ikea parts and tell me you delivered a dresser.</P>
        <P>Ok, you get the picture ⛪</P>
        <P>{'</Motivation>'}</P>
      </ContentSection>
      <SpacerSection />
      <ContentSection>
        <P>Having a simple React ( + Babel + Webpack + yarn) starter project is actually proving to be difficult starting from the documentation. You can always use create-react-app, or TodoMVC if you want to play around first. But, I want to start from scratch.</P>
        <P>In my perfect reality, a 'Hello World!' in React should be a matter of:</P>
        <Ol>
          <Li>Go to documentation</Li>
          <Li>copy / paste a simple config</Li>
          <Li>run a command in the terminal</Li>
          <Li>see Hello World</Li>
        </Ol>
        <P>I've listed 3 main libraries - so which do I start with? Which can I do without at first and then iterate into?</P>
        <P>Starting with React seems logical, since that's the UI library. Yes, we can develop in ES5 as an exercise in 'working with constraints' but, personally I like JSX and that depends on Babel. Ok, so just throw babel-standalone in the <SourceCode>{'<head>'}</SourceCode> and call it a day. But, quickly we'll see that we want to use modules and as of this writing <SourceCode>{'<script type="module">'}</SourceCode> is brittle (whitescreen with no errors if you misspell a path to any module anywhere in the tree). I guess we're going to want hot reloading too. What's the difference between live and hot reloading?</P>
        {/*<P>Before I dive into Webpack - I probably could/should have used a zero-configuration bundler like Parcel. This project would be perfect for it since it's so simple. But, I know webpack so  I'll let momentum make my decision - Just for Now™️.</P>*/}
          {/*<P>It seems counter intuitive but,  I'm going to drive off of Webpack. This isn't so farfetched though - it is the asset bundler and require runtime read: the 'framework' (here's a good comparison of these -it's cool to see makeas the first tool mentioned, read bottom up for newest tools).</P>*/}
          {/*<P>I found this little online tool in the Webpack documentation which aims to make a pretty simple jump-off point for a React project {'https://webpack.jakoblind.no/'}</P>*/}
          {/*<P>Let's see if I can get it working in an 'impatient' amount of time…</P>*/}
          {/*<P>OK, it took about 20 mins including some sips of coffee and looking out the window a couple times. That's acceptable.</P>*/}
      </ContentSection>
      <SpacerSection />
      <ContentSection>
        <P>
          Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
          activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
          banh mi cred selvage green juice four dollar toast. [2/4] 🚚 Fetching packages…
        </P>
        <P>
          <ItalicText>
            Crucifix adaptogen bespoke, health goth taiyaki tacos blue bottle yuccie you probably haven't heard of them
            activated charcoal plaid, four loko banjo wolf street art shaman live-edge. VHS disrupt jianbing PBR&B blog
            banh mi cred selvage green juice four dollar toast.
          </ItalicText>
        </P>
        <P>
          <SourceCode>() => 'source code with === ligatures';</SourceCode>
        </P>
        <P>
          <SiteInfo>Here's some site info here</SiteInfo>
        </P>
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
