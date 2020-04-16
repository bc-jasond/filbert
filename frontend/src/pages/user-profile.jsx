import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Article } from '../common/components/layout-styled-components';
import {
  Code,
  ContentSectionStyled,
  H1Styled,
  H2Styled,
  ProfileImg,
} from '../common/components/shared-styled-components';
import { authorExpandMixin } from '../common/components/shared-styled-components-mixins';

import { apiGet, apiPatch } from '../common/fetch';
import {
  formatNumber,
  formatPostDate,
  formatStreakDate,
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

export default React.memo(({ params: { username }, session, setSession }) => {
  const [shouldShow404, setShouldShow404] = useState(false);
  const [userIsMe, setUserIsMe] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function getUser() {
      if (!/^@[0-9a-z]+/.test(username)) {
        setShouldShow404(true);
        return;
      }
      const usernameWithoutAt = username.slice(1);
      const isMe = usernameWithoutAt === session.get('username');

      const { error: userError, data: userData } = await apiGet(
        `/user/${usernameWithoutAt}`
      );
      if (userError) {
        console.error('USER PROFILE Error: ', userError);
        setShouldShow404(true);
        return;
      }
      setUserIsMe(isMe);
      setUser(userData);
      if (!(userData.statsArePublic || isMe)) {
        return;
      }
      const { error: statsError, data: statsData } = await apiGet(
        `/user-stats/${usernameWithoutAt}`
      );
      if (statsError) {
        console.error('USER STATS Error: ', statsError);
        return;
      }
      setStats(statsData);
    }
    getUser();
  }, [username, session]);

  function updateProfilePublic() {
    setUser({ ...user, profileIsPublic: !user?.profileIsPublic });
    // TODO: rollback on error?
    apiPatch('/profile', { profileIsPublic: !user?.profileIsPublic });
  }

  function updateStatsArePublic() {
    setUser({ ...user, statsArePublic: !user?.statsArePublic });

    // TODO: rollback on error?
    apiPatch('/profile', { statsArePublic: !user?.statsArePublic });
  }

  if (shouldShow404) return <Page404 session={session} />;

  const statsFormatted = !stats?.totalPosts
    ? []
    : [
        {
          key: 'since',
          label: 'Member Since:',
          figure: formatPostDate(user?.created),
        },
        {
          key: 'streak',
          label: 'Current Streak:',
          figure:
            stats?.currentStreak > 0
              ? `${stats?.currentStreak} days`
              : `0 days 👩🏽‍💻 smash that 'new' button!`,
        },
        {
          key: 'streak-longest',
          label: 'Longest Streak:',
          figure: (
            <>
              {`${stats?.longestStreak} days`}
              <div>{`from ${formatStreakDate(
                stats?.longestStreakStart
              )} to ${formatStreakDate(stats?.longestStreakEnd)}`}</div>
            </>
          ),
        },
        // {key: 'cadence', label: 'Publishing Cadence:', figure: 'every TODO days'},
        {
          key: 'favorite',
          label: 'Favorite Words:',
          figure: (
            <>
              {stats?.favoriteWords.map(({ word, count }) => (
                <div key={word}>{`"${word}" used ${formatNumber(
                  count
                )} times`}</div>
              ))}
            </>
          ),
        },
        {
          key: 'avg-length',
          label: 'Avg Post Length:',
          figure: `${formatNumber(stats?.averagePostWordLength)} words`,
        },
        {
          key: 'longest',
          label: 'Longest Post:',
          figure: `${formatNumber(stats?.longestPostWords)} words`,
        },
        {
          key: 'total-chars',
          label: '# of Characters:',
          figure: formatNumber(stats?.totalCharacters),
        },
        {
          key: 'total-words',
          label: '# of Words Total:',
          figure: formatNumber(stats?.totalWords),
        },
        {
          key: 'total-posts',
          label: '# of Posts Total:',
          figure: formatNumber(stats?.totalPosts),
        },
        {
          key: 'total-published',
          label: '# of Posts Published:',
          figure: formatNumber(stats?.totalPostsPublished),
        },
        {
          key: 'total-images',
          label: '# of Images:',
          figure: formatNumber(stats?.totalImages),
        },
        {
          key: 'total-quotes',
          label: '# of Quotes:',
          figure: formatNumber(stats?.totalQuotes),
        },
      ];

  return (
    user && (
      <>
        <Header session={session} setSession={setSession} userIsMe={userIsMe} />
        <Article>
          <H1Styled>User Profile</H1Styled>
          <ContentSectionStyled>
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
          </ContentSectionStyled>
          {userIsMe && (
            <ContentSectionStyled>
              <H2Styled>Settings</H2Styled>
              <Toggle
                label="Make my profile public?"
                value={user?.profileIsPublic}
                onUpdate={updateProfilePublic}
              />
              <Toggle
                disabled={!user?.profileIsPublic}
                label="Make my stats public?"
                value={user?.statsArePublic}
                onUpdate={updateStatsArePublic}
              />
            </ContentSectionStyled>
          )}
          {stats?.totalPosts > 0 && (
            <ContentSectionStyled>
              <H2Styled>Stats</H2Styled>
              <Table>
                {statsFormatted.map(({ key, label, figure }) => (
                  <React.Fragment key={key}>
                    <TableCell>
                      <Code>{label}</Code>
                    </TableCell>
                    <TableCell>{figure}</TableCell>
                  </React.Fragment>
                ))}
              </Table>
            </ContentSectionStyled>
          )}
        </Article>
        <Footer />
      </>
    )
  );
});
