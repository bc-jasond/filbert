import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Article } from '../common/components/layout-styled-components';
import { authorExpandMixin } from '../common/components/list-all-styled-components';
import {
  Code,
  ContentSection,
  H1Styled,
  H2Styled,
  ProfileImg
} from '../common/components/shared-styled-components';

import { apiGet, apiPatch } from '../common/fetch';
import { formatPostDate } from '../common/utils';
import Page404 from './404';
import Footer from './footer';
import Header from './header';
import Toggle from '../common/components/toggle';

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;
const Col = styled.div`
  display: flex;
  flex-direction: column;
`;
const ColRight = styled(Col)`
  margin-left: 16px;
  flex-grow: 2;
  justify-content: center;
`;
const PStyled = styled.p``;
const BiggerImg = styled(ProfileImg)`
  height: 144px;
  width: 144px;
`;
const FullName = styled(H2Styled)`
  margin: 0 0 8px 0;
`;
const AuthorContainer = styled.div``;
const AuthorExpand = styled(Link)`
  ${authorExpandMixin};
`;

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
    this.getUser();
  }

  async getUser() {
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
    if (usernameWithoutAt === session.get('username')) {
      this.setState({ userIsMe: true });
    }
    try {
      const user = await apiGet(`/user/${usernameWithoutAt}`);
      this.setState({ user });
    } catch (err) {
      console.error('USER PROFILE', err);
      this.setState({ shouldShow404: true });
    }
  }

  updateProfilePublic = async () => {
    const {
      state: { user }
    } = this;
    this.setState(
      { user: { ...user, profileIsPublic: !user?.profileIsPublic } },
      () => {
        apiPatch('/profile', { profileIsPublic: !user?.profileIsPublic });
      }
    );
  };

  updateStatsArePublic = async () => {
    const {
      state: { user }
    } = this;
    this.setState(
      { user: { ...user, statsArePublic: !user?.statsArePublic } },
      () => {
        apiPatch('/profile', { statsArePublic: !user?.statsArePublic });
      }
    );
  };

  render() {
    const {
      state: { shouldShow404, user, userIsMe },
      props: { session, setSession }
    } = this;
    if (shouldShow404) return <Page404 session={session} />;

    return (
      user && (
        <>
          <Header
            session={session}
            setSession={setSession}
            userIsMe={userIsMe}
          />
          <Article>
            <H1Styled>User Profile</H1Styled>
            <ContentSection>
              <Row>
                <Col>
                  {user?.pictureUrl && <BiggerImg src={user.pictureUrl} />}
                </Col>
                <ColRight>
                  <FullName>
                    {user?.givenName} {user?.familyName}
                  </FullName>
                  <AuthorContainer>
                    <AuthorExpand to={`/public?username=${user?.username}`}>
                      {user?.username}
                    </AuthorExpand>
                  </AuthorContainer>
                </ColRight>
              </Row>
            </ContentSection>
            {userIsMe && (
              <ContentSection>
                <H2Styled>Settings</H2Styled>
                <Toggle
                  label="Make my profile public?"
                  value={user?.profileIsPublic}
                  onUpdate={this.updateProfilePublic}
                />
                <Toggle
                  label="Make my stats public?"
                  value={user?.statsArePublic}
                  onUpdate={this.updateStatsArePublic}
                />
              </ContentSection>
            )}
            {userIsMe || user?.statsArePublic ? (
              <ContentSection>
                <H2Styled>Stats</H2Styled>
                <PStyled>
                  <Code>Member Since:</Code>
                  {formatPostDate(user?.created)}
                </PStyled>
                <PStyled>
                  <Code>Current Streak:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code>Longest Streak:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code>Favorite Word:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code>Avg Post Length:</Code>TODO words
                </PStyled>
                <PStyled>
                  <Code>Longest Post:</Code>TODO words
                </PStyled>
                <PStyled>
                  <Code># of Posts Total:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code># of Posts Published:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code># of Words Total:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code># of Characters:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code># of Images:</Code>TODO
                </PStyled>
                <PStyled>
                  <Code># of Quotes:</Code>TODO
                </PStyled>
              </ContentSection>
            ) : (
              undefined
            )}
          </Article>
          <Footer />
        </>
      )
    );
  }
}
