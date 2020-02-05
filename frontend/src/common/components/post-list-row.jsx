import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { viewport7 } from '../css';
import { createNextUrl } from '../dom';
import Image from './image';
import {
  AuthorExpand,
  DetailsCol,
  ImageCol,
  ListAvatar,
  ListAvatarContent,
  ListAvatarContentRowDarker,
  ListAvatarContentRowItalic,
  ListAvatarImg,
  PostAbstractRow,
  PostActionContainer,
  PostActionLink,
  PostMetaRow,
  PostRow,
  StyledA,
  StyledHeadingA
} from './list-all-styled-components';

const ImageStyled = styled(Image)`
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
          <ImageStyled
            node={post.getIn(['meta', 'imageNode'])}
            hideBorder
            hideCaption
          />
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
          <StyledA
            href={
              postIsPrivate
                ? `/edit/${post.get('id')}`
                : `/p/${post.get('canonical')}`
            }
          >
            {post.get('abstract')}
          </StyledA>
        </PostAbstractRow>
        <PostMetaRow>
          <PostActionContainer>
            <ListAvatar>
              {(post.get('userProfileIsPublic') || postIsPrivate) && (
                <Link to={`/@${post.get('username')}`}>
                  <ListAvatarImg src={post.get('profilePictureUrl')} />
                </Link>
              )}
              <ListAvatarContent>
                {(post.get('userProfileIsPublic') || postIsPrivate) && (
                  <ListAvatarContentRowDarker>
                    {post.get('givenName')} {post.get('familyName')}
                  </ListAvatarContentRowDarker>
                )}
                <ListAvatarContentRowItalic>
                  {postIsPrivate ? post.get('updated') : post.get('published')}
                </ListAvatarContentRowItalic>
              </ListAvatarContent>
            </ListAvatar>
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
