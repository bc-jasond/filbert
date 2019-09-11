import React from 'react';
import { Redirect } from 'react-router-dom';

import { getSession, getUserName, signout } from '../common/session';

import {
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  LinkStyled,
  LinkStyledSignIn,
  SignedInUser,
  NewPost,
  ListDrafts,
  HeaderSpacer,
  Article,
  Footer,
  SocialLinksContainer,
  A,
  GitHubStyled,
  LinkedInStyled,
  InfoStyled,
} from '../common/layout-styled-components';

import EditPostButton from './edit-post-button';
import DeletePostSpan from './delete-post-span';
import PublishPostSpan from './publish-post-span';

export default class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectUrl: null,
    }
  }
  
  afterDeleteCallback = () => {
    this.setState({ redirectUrl: '/' })
  }
  
  afterPublishCallback = () => {
    const { postId } = this.props;
    this.setState( { redirectUrl: `/posts/${postId}`})
  }
  
  render() {
    const { children, postCanonical, postId } = this.props;
    const { redirectUrl } = this.state;
    return redirectUrl
      ? (<Redirect to={redirectUrl} />)
      : (
        <React.Fragment>
          <Header>
            <HeaderContentContainer>
              <LinkStyled to="/">dubaniewi.cz</LinkStyled>
              <HeaderLinksContainer>
                {getSession()
                  ? (
                    <React.Fragment>
                      <PublishPostSpan postId={postId} afterPublishCallback={this.afterPublishCallback}>publish</PublishPostSpan>
                      <EditPostButton postCanonical={postCanonical} shouldUseLargeButton={true}>edit</EditPostButton>
                      <DeletePostSpan
                        postCanonical={postCanonical}
                        postId={postId}
                        shouldUseLargeButton={true}
                        afterDeleteCallback={this.afterDeleteCallback}
                      >
                        delete
                      </DeletePostSpan>
                      <NewPost to="/edit/new">new</NewPost>
                      <ListDrafts to="/drafts">drafts</ListDrafts>
                      <SignedInUser onClick={() => {
                        if (confirm('Logout?')) {
                          signout();
                          // TODO: do something with state/props here?
                          window.location.reload();
                        }
                      }}>{getUserName()}</SignedInUser>
                    </React.Fragment>
                  )
                  : (<LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>)}
              </HeaderLinksContainer>
            </HeaderContentContainer>
          </Header>
          <HeaderSpacer />
          <Article>
            {children}
          </Article>
          <Footer>
            🚚 1/4/2019
            <SocialLinksContainer>
              <A href="https://github.com/bc-jasond/dubaniewicz-site"><GitHubStyled /></A>
              <A href="https://www.linkedin.com/in/jasondubaniewicz/"><LinkedInStyled /></A>
              <LinkStyled to="/about"><InfoStyled /></LinkStyled>
            </SocialLinksContainer>
          </Footer>
        </React.Fragment>
      )
  }
}
