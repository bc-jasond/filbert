import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  accentColorPrimary,
  accentColorSecondary,
  boxShadow,
  darkGrey,
  getVar,
} from '../../variables.css';
import { AuthorExpand, ProfileImg } from './shared-styled-components';
import {
  italicMixin,
  metaContentMixin,
} from './shared-styled-components-mixins';

const ListAvatar = styled.div`
  display: flex;
  align-items: center;
`;
const ListAvatarImg = styled(ProfileImg)`
  height: 40px;
  width: 40px;
  &:hover {
    cursor: pointer;
    box-shadow: ${getVar(boxShadow)};
  }
`;
const ListAvatarContent = styled.div`
  display: flex;
  flex-direction: column;
`;
const ListAvatarContentRow = styled.div`
  ${metaContentMixin};
  min-height: 18px; // height of metaContentMixin line-height
`;
const ListAvatarContentRowItalic = styled(ListAvatarContentRow)`
  ${italicMixin};
`;
const ListAvatarContentRowDarker = styled(ListAvatarContentRow)`
  color: ${getVar(accentColorSecondary)};
`;

export default ({ post, className, showHandle }) => {
  const postIsPrivate = !post.get('published');
  return (
    <ListAvatar className={className}>
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
        {showHandle && (
          <ListAvatarContentRow>
            <AuthorExpand to={`/public/?username=${post.get('username')}`}>
              @{post.get('username')}
            </AuthorExpand>
          </ListAvatarContentRow>
        )}
      </ListAvatarContent>
    </ListAvatar>
  );
};
