import React from 'react';
import styled from 'styled-components';

import { A, EditPost } from '../common/layout-styled-components';
import { MetaContent } from '../common/shared-styled-components';
import { userCanEditPost } from '../common/session';

const EditA = styled(A)`
  ${MetaContent};
  &:hover {
    font-weight: bolder;
  }
`;
const PostMetaContent = styled.span`
  ${MetaContent};
`;

export default class EditPostButton extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      postId: false,
    };
  }
  
  async componentDidMount() {
    const { postCanonical } = this.props;
    if (!postCanonical) {
      return;
    }
    const postId = await userCanEditPost(postCanonical);
    this.setState({ postId });
  }
  
  render() {
    const { children, shouldUseLargeButton } = this.props;
    const { postId } = this.state;
    return postId && (
      shouldUseLargeButton
        ? (<EditPost to={`/edit/${postId}`}>{children}</EditPost>)
        : (
          <React.Fragment>
            <PostMetaContent>|</PostMetaContent>
            <EditA href={`/edit/${postId}`}>{children}</EditA>
          </React.Fragment>
        )
    )
  }
}