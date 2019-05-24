import React from 'react';
import styled from 'styled-components';
import { sansSerif } from '../common/fonts.css';

import {
  Header,
  HeaderContentContainer,
  LinkStyled,
  LinkStyledAbout,
  HeaderSpacer,
  Article,
  Footer,
  SocialLinksContainer,
  A,
  GitHubStyled,
  LinkedInStyled,
} from '../common/layout-styled-components';

import Page404 from './404';

import { getContentTree, BlogPost } from '../common/blog-content.model';

const PostRow = styled.div`
  padding-top: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 20px;
  word-wrap: break-word;
  word-break: break-word;
  &:first-of-type {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
`;
const PostAbstractRow = styled.div`
  margin-top: 4px;
`;
const StyledHeadingA = styled(A)`
  max-height: 56px;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 30px;
  font-weight: 600;
`;
const StyledA = styled(A)`
  max-height: 48px;
  font-size: 18.96px;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.54);
  letter-spacing: 0px;
`;
const PostMetaRow = styled.div`
  display: flex;
  align-items: flex-end;
  margin-top: 8px;
`;
const PostMetaContent = styled.span`
  color: rgba(0, 0, 0, 0.54);
  letter-spacing: 0px;
  font-size: 15.8px;
  line-height: 20px;
  font-style: normal;
  font-family: ${sansSerif};
  padding-left: 4px;
  &:first-of-type {
    padding-left: 0;
  }
`;

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      posts: [0],
    }
  }
  
  render() {
    const { posts } = this.state;
    
    return !posts.length
      ? (<Page404 />)
      : (
        <React.Fragment>
          <Header>
            <HeaderContentContainer>
              <LinkStyled to="/">dubaniewi.cz</LinkStyled>
              <LinkStyledAbout to="/about">i</LinkStyledAbout>
            </HeaderContentContainer>
          </Header>
          <HeaderSpacer />
          <Article>
            {posts.map(post => (
              <PostRow>
                <StyledHeadingA href="#">
                  Go, Still Holding on, If Only
                </StyledHeadingA>
                <PostAbstractRow>
                  <StyledA href="#">
                    I’ve been having trouble with where my current situation is — I feel like ‘If only it were different, then I’d feel more at ease.’ I know…
                  </StyledA>
                </PostAbstractRow>
                <PostMetaRow>
                  <PostMetaContent>Monday, January 4th 2019</PostMetaContent>
                  <PostMetaContent>·</PostMetaContent>
                  <PostMetaContent>491 words</PostMetaContent>
                  <PostMetaContent>·</PostMetaContent>
                  <PostMetaContent>jason</PostMetaContent>
                </PostMetaRow>
              </PostRow>
            ))}
          </Article>
          <Footer>
            🚚 1/4/2019
            <SocialLinksContainer>
              <A href="https://github.com/bc-jasond/dubaniewicz-site"><GitHubStyled /></A>
              <A href="https://www.linkedin.com/in/jasondubaniewicz/"><LinkedInStyled /></A>
            </SocialLinksContainer>
          </Footer>
        </React.Fragment>
      );
  }
}
