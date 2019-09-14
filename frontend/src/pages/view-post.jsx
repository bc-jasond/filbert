import React from 'react';
import { Redirect } from 'react-router-dom';
import { fromJS, Map } from 'immutable';
import { ROOT_NODE_PARENT_ID } from '../common/constants';
import { apiDelete, apiGet } from '../common/fetch';
import { confirmPromise } from '../common/utils';
import { getSession, getUserName, signout } from '../common/session';

import Footer from './footer';
import {
  Article,
  DeletePost,
  EditPost,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LogoLinkStyled,
  LinkStyledSignIn,
  ListDrafts,
  NewPost,
  SignedInUser,
} from '../common/layout-styled-components';

import Page404 from './404';

import ContentNode from '../common/content-node.component';

export default class ViewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      post: Map(),
      root: null,
      nodesByParentId: {},
      shouldShow404: false,
      shouldRedirectToHome: false,
    }
  }
  
  async componentDidMount() {
    try {
      const { post, contentNodes } = await apiGet(`/post/${this.props.match.params.canonical}`);
      const nodesByParentId = fromJS(contentNodes);
      // TODO: don't use 'null' as root node indicator
      const root = nodesByParentId.get(ROOT_NODE_PARENT_ID).get(0);
      this.setState({ post: fromJS(post), root, nodesByParentId, shouldShow404: false })
    } catch (err) {
      console.error(err);
      this.setState({ pageContent: null, shouldShow404: true })
    }
  }
  
  deletePost = async () => {
    const { post } = this.state;
    try {
      await confirmPromise(`Delete post ${post.get('title')}?`);
      await apiDelete(`/post/${post.get('id')}`);
      this.setState({ shouldRedirectToHome: true });
    } catch (err) {
      console.error('Delete post error:', err)
    }
  }
  
  render() {
    const {
      post,
      root,
      nodesByParentId,
      shouldShow404,
      shouldRedirectToHome,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    if (shouldRedirectToHome) return (<Redirect to="/" />);
    
    return (
      <React.Fragment>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">dubaniewi.cz</LogoLinkStyled>
            <HeaderLinksContainer>
              {getSession()
                ? (
                  <React.Fragment>
                    {post.get('canEdit') && (<EditPost to={`/edit/${post.get('id')}`}>edit</EditPost>)}
                    <NewPost to="/edit/new">new</NewPost>
                    <ListDrafts to="/drafts">drafts</ListDrafts>
                    <SignedInUser onClick={() => {
                      if (confirm('Logout?')) {
                        signout();
                        // TODO: do something with state/props here?
                        window.location.reload();
                      }
                    }}>{getUserName()}</SignedInUser>
                  </React.Fragment>)
                : (
                  <LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>
                )}
            </HeaderLinksContainer>
          </HeaderContentContainer>
        </Header>
        <HeaderSpacer />
        <Article>
          {root && (
            <ContentNode node={root} nodesByParentId={nodesByParentId} />
          )}
        </Article>
        <Footer />
      </React.Fragment>
    )
  }
}
