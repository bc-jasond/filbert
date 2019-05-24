import React from 'react';

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

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      pageContent: null,
    }
  }
  
  async loadData() {
    const response = await fetch(`http://localhost:3001/post/${this.props.match.params.id}`);
    const { post, contentNodes } = await response.json();
    this.setState({pageContent: getContentTree(contentNodes)})
  }
  
  async componentDidMount() {
    this.loadData();
  }
  
  render() {
    const { pageContent } = this.state;
    
    return !pageContent
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
            {pageContent.render()}
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
