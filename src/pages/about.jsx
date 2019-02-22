import React from 'react';
import {
  A,
  Code,
  ContentSection,
  H1,
  H2,
  ItalicText,
  P,
  SpacerSection,
  Ol,
  Li,
  LinkStyled
} from '../common/shared-styled-components';

export default () => (
  <React.Fragment>
    <H1>{'<Motivation>'}</H1>
    <ContentSection>
      <H2>Who?</H2>
      <P>Hi. I'm a software engineer living in the Bay Area. Professionally, I've been frontend focused but, I
        love working on APIs, databases, networking and linux, too. I'm also interested in woodworking, build /
        remodel
        projects, biking, classic literature, personal development, songwriting, singing, starting bands &
        playing shows, baking, photography.</P>
      <H2>What?</H2>
      <P>I'm building & writing this blog about software musings & HOWTOs. As I iterate on it for <A href="https://rein.pk/finding-product-market-fit">my own</A>&nbsp;
        <A href="https://basecamp.com/books/getting-real">needs</A> (even if these 'needs' are artificial and already
        well-solved by other
        offerings):</P>
      <Ol>
        <Li>a blog</Li>
        <Li>a comments section</Li>
        <Li>social integrations for sharing posts</Li>
        <Li>users</Li>
        <Li>relational data</Li>
        <Li>tenancy (one for each mood - how will I manage permissions?)</Li>
        <Li>who knows what else?</Li>
      </Ol>
      <P>It will produce writing topics. A veritable <A href="https://biologicperformance.com/sealed-bottle-terrarium-garden-watered-once-53-years/">closed system</A>.</P>
      <H2>Why?</H2>
      <P>I decided that I'm not allowing myself to 'just copy and paste from Stack Overflow' anymore. It's been a good run but, this too shall pass. It works for building stuff quickly but, if everyone's a pasta chef - what happens when you run outta tomatoes?</P>
      <P>Plain and simple, there's no leverage like that of deep knowledge of first-principles.  A few years ago I
        took the first step in <A href="https://github.com/getify/You-Dont-Know-JS">'really'</A>{' '}
        <A href="https://www.crockford.com/javascript/index.html">learning</A>{' '}
        <A href="https://brendaneich.com/">JavaScript</A> and that has been great but, now it's time to go further and with all the things.</P>
        <P>I want to <A href="http://www.catb.org/jargon/html/story-of-mel.html">be like Mel</A>. Building this app and writing about it is how I'm going to do it. Also, it's
        proving to be pretty fun.</P>
      <P>They say that teaching is the best way to identify gaps in knowledge.  After a short time trying to teach, I agree with that.</P>
      <Ol>
        <Li><ItalicText>"If you can't explain it
          simply, you don't
          understand it."</ItalicText> -<A href="https://en.wikiquote.org/wiki/Talk:Richard_Feynman#Teaching_quote">Richard
          Feynman</A></Li>
        <Li>I love <A href="https://en.wikiquote.org/wiki/Alan_Kay">Alan Kay's quotes too</A> (find-in-page:
          Egyptian pyramids - yep, still relevant)</Li>
        <Li><ItalicText>If you find that you're spending almost all your time on theory, start turning some attention to practical things; it will improve your theories. If you find that you're spending almost all your time on practice, start turning some attention to theoretical things; it will improve your practice.</ItalicText> -<A href="https://en.wikiquote.org/wiki/Donald_Knuth">Donald Knuth</A></Li>
        <Li><ItalicText>Tools are not the Answer.</ItalicText> -<A href="https://blog.cleancoder.com/uncle-bob/2017/10/04/CodeIsNotTheAnswer.html">Uncle
          Bob</A></Li>
      </Ol>
      <P>Most of the time architecture is the <ItalicText>wrong thing</ItalicText> to be working on since it's hard to
        quantify a business value. "If it ain't broke don't fix it." On larger projects there can be a lot of fear and
        uncertainty around changing code critical to the build system or core architecture. Changing that code is risky
        and often requires a blind 'break and fix' approach that you can only test
        so much on a local or lower environment.</P>
      <P>But, <A href="https://en.wikipedia.org/wiki/Tragedy_of_the_commons">tragedy of the commons</A> is a thing in
        software development especially with autonomous product-focused delivery teams. Eventually it impacts the
        business. So what do you do
        about it?</P>
      <P>I guess that's the point of side-projects. Make as many mistakes in the toy system as you can. Fix them.
        Write about it. Level up.</P>
      <H2>How?</H2>
      <P>
        I'm going to 'start from scratch' with this project so that I get a complete understanding of each step; adding
        new libraries/frameworks/tools/abstractions incrementally when a 'real' need occurs like: I can't write the code
        I
        need, the
        system can't handle load, I run out of space, etc.
      </P>
      <P>I'm a beliver in <Code>let it become a problem</Code> as opposed to <Code>solve it upfront</Code>. Draft up
        some guiding principles, work under those constraints until you can't.</P>
      <P>Don't solve for that edge case. Don't support that feature. Don't nest that object. Don't make a list of one
        item. Don't use that framework. Don't make a service. Don't create a DSL. Don't make the API 'more
        flexible'.</P>
      <P>Don't give me a box of Ikea parts and tell me you delivered a dresser.</P>
      <P>Ok, you get the picture ⛪</P>
      <P>{'</Motivation>'}</P>
    </ContentSection>
    <SpacerSection />
    <ContentSection>
      <H2>
        <LinkStyled to="/posts">Read some posts...</LinkStyled>
      </H2>
    </ContentSection>
  </React.Fragment>
);