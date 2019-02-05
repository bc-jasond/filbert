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
    <H1>Basic Nginx config for a React app with React Router</H1>
    <SpacerSection />
    <H2>Pass Routing Responsibilies up to the Browser (React Router) - Part 3 - replace <Code>webpack-dev-server</Code>with <Code>nginx</Code></H2>
    <ContentSection>
      <P>Last time we <LinkStyled to="/posts/react-router">installed Nginx on our Ubuntu AWS EC2</LinkStyled> and we fired it up to see the test page.  In this post, we'll take a look at how to serve our webpack bundles and other static assets.</P>
      <P>TODO: write the blog post</P>
    </ContentSection>
    <ContentSection>
      <P><SiteInfo>TODO: put the recap here</SiteInfo></P>
      <P>💡Remember: <ItalicText>The real problem is that programmers have spent far too much time worrying about efficiency in the wrong places and at the wrong times; premature optimization is the root of all evil (or at least most of it) in programming. <A href="https://dl.acm.org/citation.cfm?id=361612">-Donald Knuth</A> from "Computer programming as an art" p. 671 of CACM Dec 1974</ItalicText></P>
      <P><SiteInfo>Thanks for reading</SiteInfo></P>
    </ContentSection>
    <ContentSection>
      <H2>
        <LinkStyled to="/posts">Back to all Posts</LinkStyled>
      </H2>
    </ContentSection>
  </React.Fragment>
)