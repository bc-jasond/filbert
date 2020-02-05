import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { viewport7 } from '../css';
import { createNextUrl } from '../dom';
import { AbstractLink, StyledHeadingA } from './layout-styled-components';
import PostAvatar from './post-avatar';
import Image from './image';
import { AuthorExpand, FlexGrid } from './shared-styled-components';
import {
  metaFontMixin,
  navButtonMixin
} from './shared-styled-components-mixins';

const PostRow = styled(FlexGrid)`
  max-width: ${viewport7};
  padding: 16px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  align-items: center;
  &:last-of-type {
    margin-bottom: 42px;
  }
  @media (min-width: ${viewport7}) {
    margin: 0 auto;
  }
`;
const ImageCol = styled.div`
  padding: 0;
  flex: 1;
  margin-bottom: 16px;
  @media (min-width: ${viewport7}) {
    margin-bottom: 0;
    margin-right: 16px;
  }
`;
const DetailsCol = styled.div`
  padding: 0;
  flex: 4;
`;
const PostAbstractRow = styled.div`
  margin-top: 4px;
`;
const PostMetaRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 8px;
`;
const PostActionContainer = styled.div`
  position: relative;
  min-height: 18px;
  display: inline-block;
  padding-left: ${p => (p.noPadding ? '0' : '8px')};
  &:first-of-type {
    padding-left: 0;
  }
`;
const PostActionLink = styled(Link)`
  ${navButtonMixin};
  ${metaFontMixin};
  padding: 6px 8px;
`;
const PostImage = styled(Image)`
  margin: 0 auto;
  max-width: 300px;
  max-height: 300px;
  @media (min-width: ${viewport7}) {
    max-width: 150px;
    max-height: 150px;
  }
`;

export default ({ post }) => {
  const postIsPrivate = !post.get('published');
  return (
    <PostRow>
      {post.getIn(['meta', 'imageNode']) && (
        <ImageCol>
          <Link
            to={
              postIsPrivate
                ? `/edit/${post.get('id')}`
                : `/p/${post.get('canonical')}`
            }
          >
            <PostImage
              node={post.getIn(['meta', 'imageNode'])}
              hideBorder
              hideCaption
            />
          </Link>
        </ImageCol>
      )}
      <DetailsCol>
        <StyledHeadingA
          href={
            postIsPrivate
              ? `/edit/${post.get('id')}`
              : `/p/${post.get('canonical')}`
          }
        >
          {post.get('title')}
        </StyledHeadingA>
        <PostAbstractRow>
          <AbstractLink
            href={
              postIsPrivate
                ? `/edit/${post.get('id')}`
                : `/p/${post.get('canonical')}`
            }
          >
            {post.get('abstract')}
          </AbstractLink>
        </PostAbstractRow>
        <PostMetaRow>
          <PostActionContainer>
            <PostAvatar post={post} />
          </PostActionContainer>
          {post.get('canEdit') && (
            <PostActionContainer>
              <PostActionLink to={createNextUrl(`/publish/${post.get('id')}`)}>
                publish
              </PostActionLink>
            </PostActionContainer>
          )}
          {!postIsPrivate && post.get('canEdit') && (
            <PostActionContainer noPadding>
              <PostActionLink to={`/edit/${post.get('id')}`}>
                edit
              </PostActionLink>
            </PostActionContainer>
          )}
          <PostActionContainer>
            <AuthorExpand to={`/public?username=${post.get('username')}`}>
              {post.get('username')}
            </AuthorExpand>
          </PostActionContainer>
        </PostMetaRow>
      </DetailsCol>
    </PostRow>
  );
};
