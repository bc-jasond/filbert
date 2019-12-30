import React from 'react';
import { Article } from '../common/components/layout-styled-components';
import {
  BoldText,
  ContentSection,
  H1Styled,
  H2Styled,
  ProfileImg,
  PStyled
} from '../common/components/shared-styled-components';
import { apiGet } from '../common/fetch';
import { formatPostDate } from '../common/utils';
import Page404 from './404';

import Header from './header';
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
        params: { username },
        session
      }
    } = this;
    if (!/^@[0-9a-z]+/.test(username)) {
      this.setState({ shouldShow404: true });
      return;
    }
    const usernameWithoutAt = username.slice(1);
    if (usernameWithoutAt === session?.username) {
      this.setState({ user: session, userIsMe: true });
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
      state: { shouldShow404, user, userIsMe },
      props: { session, setSession }
    } = this;
    if (shouldShow404) return <Page404 />;

    return (
      <>
        <Header session={session} setSession={setSession} userIsMe={userIsMe} />
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
