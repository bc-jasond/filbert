import React from 'react';
import {
  Article,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LinkStyledSignIn,
  ListDrafts,
  LogoLinkStyled,
  Logout,
  NewPost,
  SignedInUser
} from '../common/components/layout-styled-components';
import {
  BoldText,
  ContentSection,
  H1Styled,
  H2Styled,
  ProfileImg,
  PStyled
} from '../common/components/shared-styled-components';
import { apiGet } from '../common/fetch';
import { getSession, getUserName, signout } from '../common/session';
import { formatPostDate } from '../common/utils';
import Page404 from './404';

import Footer from './footer';

export default class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldShow404: false,
      userIsMe: false,
      user: null
    };
  }

  async componentDidMount() {
    const {
      props: {
        match: {
          params: { username }
        }
      }
    } = this;
    if (!/^@[0-9a-z]+/.test(username)) {
      this.setState({ shouldShow404: true });
      return;
    }
    const usernameWithoutAt = username.slice(1);
    if (usernameWithoutAt === getUserName()) {
      this.setState({ user: getSession(), userIsMe: true });
      return;
    }
    try {
      const user = await apiGet(`/user/${usernameWithoutAt}`);
      this.setState({ user });
    } catch (err) {
      this.setState({ shouldShow404: true });
    }
  }

  render() {
    const {
      state: { shouldShow404, user, userIsMe }
    } = this;
    if (shouldShow404) return <Page404 />;

    return (
      <>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">
              <span role="img" aria-label="hand writing with a pen">
                ✍️
              </span>{' '}
              filbert
            </LogoLinkStyled>
            <HeaderLinksContainer>
              {getSession() ? (
                <>
                  <NewPost to="/edit/new">new</NewPost>
                  <ListDrafts to="/discover">discover</ListDrafts>
                  <ListDrafts to="/private">private</ListDrafts>
                  {userIsMe ? (
                    <Logout
                      onClick={() => {
                        if (confirm('Logout?')) {
                          signout();
                          window.location.href = '/';
                        }
                      }}
                    >
                      logout
                    </Logout>
                  ) : (
                    <SignedInUser to="/me">{getUserName()}</SignedInUser>
                  )}
                </>
              ) : (
                <LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>
              )}
            </HeaderLinksContainer>
          </HeaderContentContainer>
        </Header>
        <HeaderSpacer />
        <Article>
          <H1Styled>User Profile</H1Styled>
          <ContentSection>
            {user?.pictureUrl && <ProfileImg src={user.pictureUrl} />}
          </ContentSection>
          <H2Styled>
            {user?.givenName} {user?.familyName}
          </H2Styled>
          <ContentSection>
            <BoldText>@{user?.username}</BoldText>
            <PStyled>Member Since: {formatPostDate(user?.created)}</PStyled>
          </ContentSection>
        </Article>
        <Footer />
      </>
    );
  }
}
