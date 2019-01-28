import React from 'react';
import { A, Code, ContentSection, H1, H2, ItalicText, P, SpacerSection } from '../common/shared-styled-components';

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
      <P>I'm building & writing this blog about software musings & HOWTOs. As I iterate on the development of this
        blog
        for <A href="https://rein.pk/finding-product-market-fit">my own</A>&nbsp;
        <A href="https://basecamp.com/books/getting-real">needs</A> (even if these 'needs' are artificial and already
        well-solved by other
        offerings) - a blog, a comments section, social integrations for sharing my
        posts, relational data, tenancy (one for each mood, lol -- how will I manage permissions?), etc - It will
        produce writing topics.</P>
      <H2>Why?</H2>
      <P>I decided that I'm not allowing myself to 'just copy and paste from Stack Overflow' anymore. I'm good at it. In
        fact, I'm f'in great at it and I've made a successful career out of it (that's a joke). But, it's not doing it for me anymore.
        It's not deeply satisfying; only kind-of knowing how things work. A few years ago I
        took the first step in <A href="https://github.com/getify/You-Dont-Know-JS">'really'</A> <A href="https://www.crockford.com/javascript/index.html">learning</A> <A href="https://brendaneich.com/">JavaScript</A> and that has been great but, now it's time to go further. I want
        to <A href="http://www.catb.org/jargon/html/story-of-mel.html">be like Mel</A>. Going deep is a habit, a way of
        life and I'm signing myself up for it.</P>
      <P>Building this app and writing about it is how I'm going to show up to 'do the reps', build this new habit and
        'stay in shape' for what lays ahead.</P>
      <P>Teaching is the best way to identify gaps in knowledge.<ItalicText>"If you can't explain it simply, you don't
        understand it."</ItalicText> -<A href="https://en.wikiquote.org/wiki/Talk:Richard_Feynman#Teaching_quote">Richard
        Feynman</A>. I love <A href="https://en.wikiquote.org/wiki/Alan_Kay">Alan Kay's quotes too</A> (find-in-page:
        Egyptian pyramids). And <A href="https://blog.cleancoder.com/uncle-bob/2017/10/04/CodeIsNotTheAnswer.html">Uncle
          Bob's 'Clean Code'</A>
      </P>
      <P>Most of the time architecture is the <ItalicText>wrong thing</ItalicText> to be working on since it's hard to
        quantify a business value. "if it ain't broke don't fix it." On larger projects there can be a lot of fear and
        uncertainty around changing code critical to the build system or core architecture. It has become 'special code'
        and the authors 'special engineers' sanctified by the organization. This puts even more scrutiny on any
        changes. Changing that code is risky and often requires a blind 'break and fix' approach that you can only test
        so much on a local environment.</P>
      <P>But, <A href="https://en.wikipedia.org/wiki/Tragedy_of_the_commons">tragedy of the commons</A> is a thing in
        software development
        (especially in autonomous product-focused teams) and eventually it will impact the business. So what do you do
        about it?</P>
      <P>I guess that's the point of side-projects. Make as many mistakes in the toy system as you can. Fix them.
        Write about it. Level up.</P>
      <H2>How?</H2>
      <P>I want to 'start from scratch' with this project so that I get a complete understanding of each step; adding
        new libraries/frameworks/tools/abstractions incrementally when a 'real' need occurs: I can't write the code I
        need, the
        system can't handle load, I run out of space.</P><P>I'm a beliver in <Code>let it become a problem</Code>; the
      opposite of: identify, plan for and solve any and every
      foreseeable issue upfront. Draft up some guiding principles, work under those constraints until you can't.</P>
      <P>Don't solve for that edge case. Don't support that feature. Don't nest that object. Don't make a list of one
        item. Don't use that framework. Don't make a service. Don't create a DSL. Don't make the API 'more flexible'
        for theoretical future
        requirements. Don't give me a box of Ikea parts and tell me you delivered a dresser.</P>
      <P>Ok, you get the picture ⛪</P>
      <P>{'</Motivation>'}</P>
    </ContentSection>
    <SpacerSection />
  </React.Fragment>
);