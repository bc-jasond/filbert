import React from 'react';
import styled from 'styled-components';
import Image from './image';
import {
  AuthorExpand,
  AuthorExpandContainer,
  DetailsCol,
  ImageCol,
  ListAvatar,
  ListAvatarContent,
  ListAvatarContentRow,
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
        <StyledHeadingA href={`/edit/${post.get('id')}`}>
          {post.get('title')}
        </StyledHeadingA>
        <PostAbstractRow>
          <StyledA href={`/edit/${post.get('id')}`}>
            {post.get('abstract')}
          </StyledA>
        </PostAbstractRow>
        <PostMetaRow>
          <PostActionContainer>
            <ListAvatar>
              {(post.get('userProfileIsPublic') || postIsPrivate) && (
                <ListAvatarImg src={post.get('profilePictureUrl')} />
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
            <>
              <PostActionContainer>
                <PostActionLink to={`/post-details/${post.get('id')}`}>
                  details
                </PostActionLink>
              </PostActionContainer>
              <PostActionContainer noPadding>
                <PostActionLink to={`/edit/${post.get('id')}`}>
                  edit
                </PostActionLink>
              </PostActionContainer>
            </>
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
