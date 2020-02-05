import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Article } from '../common/components/layout-styled-components';
import {
  Code,
  ContentSection,
  H1Styled,
  H2Styled,
  ProfileImg
} from '../common/components/shared-styled-components';
import { authorExpandMixin } from '../common/components/shared-styled-components-mixins';

import { apiGet, apiPatch } from '../common/fetch';
import {
  formatNumber,
  formatPostDate,
  formatStreakDate
} from '../common/utils';
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
const Table = styled.div`
  display: flex;
  flex-flow: row wrap;
`;
const TableCell = styled.div`
  box-sizing: border-box;
  flex-grow: 1;
  width: 50%;
  overflow: hidden;
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
    await this.getUser();
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
    const userIsMe = usernameWithoutAt === session.get('username');

    const { error: userError, data: user } = await apiGet(
      `/user/${usernameWithoutAt}`
    );
    if (userError) {
      console.error('USER PROFILE Error: ', userError);
      this.setState({ shouldShow404: true });
      return;
    }
    this.setState({ userIsMe, user });
    if (!(user.statsArePublic || userIsMe)) {
      return;
    }
    const { error: statsError, data: stats } = await apiGet(
      `/user-stats/${usernameWithoutAt}`
    );
    if (statsError) {
      console.error('USER STATS Error: ', statsError);
      return;
    }
    this.setState({ stats });
  }

  updateProfilePublic = async () => {
    const {
      state: { user }
    } = this;
    this.setState(
      { user: { ...user, profileIsPublic: !user?.profileIsPublic } },
      () => {
        // TODO: rollback on error?
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
        // TODO: rollback on error?
        apiPatch('/profile', { statsArePublic: !user?.statsArePublic });
      }
    );
  };

  render() {
    const {
      state: { shouldShow404, user, userIsMe, stats },
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
                  disabled={!user?.profileIsPublic}
                  label="Make my stats public?"
                  value={user?.statsArePublic}
                  onUpdate={this.updateStatsArePublic}
                />
              </ContentSection>
            )}
            {stats && (
              <ContentSection>
                <H2Styled>Stats</H2Styled>
                <Table>
                  <TableCell>
                    <Code>Member Since:</Code>
                  </TableCell>
                  <TableCell>{formatPostDate(user?.created)}</TableCell>
                  <TableCell>
                    <Code>Current Streak:</Code>
                  </TableCell>
                  <TableCell>
                    {stats?.currentStreak > 0
                      ? `${stats?.currentStreak} days`
                      : `0 days 👩🏽‍💻 hit that 'new' button!`}
                  </TableCell>
                  <TableCell>
                    <Code>Longest Streak:</Code>
                  </TableCell>
                  <TableCell>
                    {`${stats?.longestStreak} days`}
                    <div>{`from ${formatStreakDate(
                      stats?.longestStreakStart
                    )} to ${formatStreakDate(stats?.longestStreakEnd)}`}</div>
                  </TableCell>
                  {/* <TableCell> */}
                  {/*  <Code>Publishing Cadence:</Code> */}
                  {/* </TableCell> */}
                  {/* <TableCell> */}
                  {/*  every TODO days */}
                  {/* </TableCell> */}
                  <TableCell>
                    <Code>Favorite Words:</Code>
                  </TableCell>
                  <TableCell>
                    {stats?.favoriteWords.map(({ word, count }) => (
                      <div>{`"${word}" used ${formatNumber(count)} times`}</div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Code>Avg Post Length:</Code>
                  </TableCell>
                  <TableCell>{`${formatNumber(
                    stats?.averagePostWordLength
                  )} words`}</TableCell>
                  <TableCell>
                    <Code>Longest Post:</Code>
                  </TableCell>
                  <TableCell>{`${formatNumber(
                    stats?.longestPostWords
                  )} words`}</TableCell>
                  <TableCell>
                    <Code># of Characters:</Code>
                  </TableCell>
                  <TableCell>{formatNumber(stats?.totalCharacters)}</TableCell>
                  <TableCell>
                    <Code># of Words Total:</Code>
                  </TableCell>
                  <TableCell>{formatNumber(stats?.totalWords)}</TableCell>
                  <TableCell>
                    <Code># of Posts Total:</Code>
                  </TableCell>
                  <TableCell>{formatNumber(stats?.totalPosts)}</TableCell>
                  <TableCell>
                    <Code># of Posts Published:</Code>
                  </TableCell>
                  <TableCell>
                    {formatNumber(stats?.totalPostsPublished)}
                  </TableCell>
                  <TableCell>
                    <Code># of Images:</Code>
                  </TableCell>
                  <TableCell>{formatNumber(stats?.totalImages)}</TableCell>
                  <TableCell>
                    <Code># of Quotes:</Code>
                  </TableCell>
                  <TableCell>{formatNumber(stats?.totalQuotes)}</TableCell>
                </Table>
              </ContentSection>
            )}
          </Article>
          <Footer />
        </>
      )
    );
  }
}
