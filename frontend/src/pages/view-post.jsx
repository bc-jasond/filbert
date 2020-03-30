import React from 'react';
import styled from 'styled-components';
import { Link, Redirect } from 'react-router-dom';
import { fromJS, Map } from 'immutable';
import Image from '../common/components/image';
import { PAGE_NAME_VIEW } from '../common/constants';
import { grey, viewport7 } from '../common/css';
import { apiGet } from '../common/fetch';
import { monospaced } from '../common/fonts.css';
import { formatPostDate, reviver } from '../common/utils';

import Header from './header';
import Footer from './footer';
import Page404 from './404';

import { sectionWidthMixin } from '../common/components/shared-styled-components-mixins';
import {
  Col,
  FlexGrid,
  H3Styled,
  SiteInfo,
} from '../common/components/shared-styled-components';
import {
  AbstractLink,
  Article,
  StyledHeadingA,
} from '../common/components/layout-styled-components';
import Document from '../common/components/document.component';
import PostAvatar from '../common/components/post-avatar';

const PostDetailsSection = styled.section`
  ${sectionWidthMixin};
  margin-bottom: 16px;
`;
const PrevNextPostSection = styled.section`
  ${sectionWidthMixin};
  margin-bottom: 16px;
`;
const H3Centered = styled(H3Styled)`
  font-family: ${monospaced};
  color: ${grey};
  text-align: center;
`;
const ImageContainer = styled.div`
  margin-bottom: 4px;
  max-height: 300px;
  overflow: hidden;
  @media (min-width: ${viewport7}) {
    max-height: 200px;
  }
`;
const TitleContainer = styled.div`
  padding: 4px;
`;
const AbstractContainer = styled.div`
  padding: 4px;
`;
const PostAvatarContainer = styled.div`
  padding: 4px;
`;
const PostImage = styled(Image)`
  margin: 0 auto;
  min-width: 300px;
  min-height: 200px;
`;
const SiteInfoStyled = styled(SiteInfo)`
  display: block;
  font-size: 32px;
  text-align: center;
  margin: 48px 0 32px 0;
`;

function NextPostNav({ post, isPrevious }) {
  return (
    <Col>
      {isPrevious ? (
        <H3Centered>
          <span role="img" aria-label="finger pointing left">
            👈
          </span>{' '}
          previous
        </H3Centered>
      ) : (
        <H3Centered>
          next{' '}
          <span role="img" aria-label="finger pointing right">
            👉
          </span>
        </H3Centered>
      )}
      <ImageContainer>
        {post.getIn(['meta', 'imageNode']) && (
          <ImageContainer>
            <Link to={`/p/${post.get('canonical')}`}>
              <PostImage
                node={post.getIn(['meta', 'imageNode'])}
                hideBorder
                hideCaption
              />
            </Link>
          </ImageContainer>
        )}
      </ImageContainer>
      <TitleContainer>
        <StyledHeadingA href={`/p/${post.get('canonical')}`}>
          {post.get('title')}
        </StyledHeadingA>
      </TitleContainer>
      <AbstractContainer>
        <AbstractLink href={`/p/${post.get('canonical')}`}>
          {post.get('abstract')}
        </AbstractLink>
      </AbstractContainer>
      <PostAvatarContainer>
        <PostAvatar post={post} showHandle />
      </PostAvatarContainer>
    </Col>
  );
}

export default class ViewPost extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      prevPost: Map(),
      nextPost: Map(),
      post: Map(),
      nodesById: Map(),
      shouldShow404: false,
      shouldRedirectToHome: false,
    };
  }

  async componentDidMount() {
    await this.loadPost();
  }

  async componentDidUpdate(prevProps) {
    const params = this.props?.params;
    const id = params?.canonical;
    const prevId = prevProps?.params?.canonical;
    if (id === prevId) {
      return;
    }
    await this.loadPost();
  }

  async loadPost() {
    const {
      error,
      data: { prevPost, nextPost, post, contentNodes } = {},
    } = await apiGet(`/post/${this.props?.params?.canonical}`);
    if (error) {
      console.error(error);
      this.setState({ shouldShow404: true });
      return;
    }
    prevPost.published = formatPostDate(prevPost.published);
    nextPost.published = formatPostDate(nextPost.published);
    post.published = formatPostDate(post.published);
    this.setState({
      prevPost: fromJS(prevPost),
      nextPost: fromJS(nextPost),
      post: fromJS(post),
      nodesById: fromJS(contentNodes, reviver),
      shouldShow404: false,
    });
  }

  render() {
    const {
      state: {
        prevPost,
        nextPost,
        post,
        nodesById,
        shouldShow404,
        shouldRedirectToHome,
      },
      props: { session, setSession },
    } = this;

    if (shouldShow404) return <Page404 session={session} />;
    if (shouldRedirectToHome) return <Redirect to="/" />;

    return (
      nodesById.size > 0 && (
        <>
          <Header
            session={session}
            setSession={setSession}
            post={post}
            pageName={PAGE_NAME_VIEW}
          />
          <Article>
            <PostDetailsSection>
              <PostAvatar post={post} showHandle />
            </PostDetailsSection>
            <Document nodesById={nodesById} />
            <PrevNextPostSection>
              <SiteInfoStyled>
                Thanks for reading{' '}
                <span role="img" aria-label="peace sign">
                  ✌🏼
                </span>
              </SiteInfoStyled>
              <FlexGrid>
                <NextPostNav post={prevPost} isPrevious />
                <NextPostNav post={nextPost} />
              </FlexGrid>
            </PrevNextPostSection>
          </Article>
          <Footer />
        </>
      )
    );
  }
}
