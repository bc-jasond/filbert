import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { fromJS, Map } from 'immutable';
import Image from '../common/components/image';
import { PAGE_NAME_VIEW } from '../common/constants';
import { apiGet } from '../common/fetch';
import { formatPostDate, reviver } from '../common/utils';
import {
  codeFontFamily,
  getVar,
  grey,
  viewport7,
  viewport9,
} from '../variables.css';

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

const ColStyled = styled(Col)`
  margin-bottom: 32px;
`;
const PostDetailsSection = styled.section`
  ${sectionWidthMixin};
  margin-bottom: 16px;
`;
const PrevNextPostSection = styled.section`
  ${sectionWidthMixin};
  margin-bottom: 16px;
  max-width: ${viewport9};
`;
const H3Centered = styled(H3Styled)`
  font-family: ${getVar(codeFontFamily)};
  color: ${grey};
  text-align: center;
`;
const ImageContainer = styled.div`
  margin-bottom: 4px;
  max-height: 550px;
  overflow: hidden;
  @media (min-width: ${viewport7}) {
    max-height: 250px;
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
const ThanksForReading = styled.span`
  letter-spacing: 0.6rem;
`;

const NextPostNav = React.memo(({ post, isPrevious }) => (
  <ColStyled>
    {isPrevious ? (
      <H3Centered>
        <span role="img" aria-label="finger pointing left">
          👈👈👈
        </span>{' '}
        previous
      </H3Centered>
    ) : (
      <H3Centered>
        next{' '}
        <span role="img" aria-label="finger pointing right">
          👉👉👉
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
  </ColStyled>
));

export default React.memo(
  ({
    params: { canonical },
    session,
    setSession,
    font,
    toggleFont,
    theme,
    toggleTheme,
  }) => {
    const [prevPost, setPrevPost] = useState(Map());
    const [nextPost, setNextPost] = useState(Map());
    const [post, setPost] = useState(Map());
    const [nodesById, setNodesById] = useState(Map());
    const [shouldShow404, setShouldShow404] = useState(false);

    useEffect(() => {
      async function loadPost() {
        const {
          error,
          data: {
            prevPost: prevPostData,
            nextPost: nextPostData,
            post: postData,
            contentNodes,
          } = {},
        } = await apiGet(`/post/${canonical}`);
        if (error) {
          console.error(error);
          setShouldShow404(true);
          return;
        }
        prevPostData.published = formatPostDate(prevPostData.published);
        nextPostData.published = formatPostDate(nextPostData.published);
        postData.published = formatPostDate(postData.published);
        setPrevPost(fromJS(prevPostData));
        setNextPost(fromJS(nextPostData));
        setPost(fromJS(postData));
        setNodesById(fromJS(contentNodes, reviver));
        setShouldShow404(false);
      }
      loadPost();
    }, [canonical]);

    if (shouldShow404) return <Page404 session={session} />;

    return (
      nodesById.size > 0 && (
        <>
          <Header
            session={session}
            setSession={setSession}
            font={font}
            toggleFont={toggleFont}
            theme={theme}
            toggleTheme={toggleTheme}
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
                <ThanksForReading>Thanks for reading</ThanksForReading>
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
);
