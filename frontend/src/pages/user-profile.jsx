import React from 'react';
import styled from 'styled-components';
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
import Footer from './footer';

import Header from './header';

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
      console.error("USER PROFILE", err)
      this.setState({ shouldShow404: true });
    }
  }
  
  render() {
    const {
      state: { shouldShow404, user, userIsMe },
      props: { session, setSession }
    } = this;
    if (shouldShow404) return <Page404 session={session} />;
    
    return user && (
      <>
        <Header session={session} setSession={setSession} userIsMe={userIsMe} />
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
                <BoldText>@{user?.username}</BoldText>
              </ColRight>
            </Row>
          </ContentSection>
          <ContentSection>
            <PStyled>Member Since: {formatPostDate(user?.created)}</PStyled>
          </ContentSection>
        </Article>
        <Footer />
      </>
    );
  }
}
