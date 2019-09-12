import React from 'react';
import { fromJS } from 'immutable';
import { ROOT_NODE_PARENT_ID } from '../common/constants';
import { apiGet } from '../common/fetch';

import Footer from './footer';
import {
  Article,
  DeletePost,
  EditPost,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LinkStyled,
  LinkStyledSignIn,
  ListDrafts,
  NewPost,
  PublishPost,
  SignedInUser,
} from '../common/layout-styled-components';
import { getSession, getUserName, signout } from '../common/session';

import Page404 from './404';

import ContentNode from '../common/content-node.component';

export default class ViewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      root: null,
      nodesByParentId: {},
      shouldShow404: false,
    }
  }
  
  async componentDidMount() {
    try {
      const { post, contentNodes } = await apiGet(`/post/${this.props.match.params.canonical}`);
      const nodesByParentId = fromJS(contentNodes);
      // TODO: don't use 'null' as root node indicator
      const root = nodesByParentId.get(ROOT_NODE_PARENT_ID).get(0);
      this.setState({ root, nodesByParentId, shouldShow404: false })
    } catch (err) {
      console.error(err);
      this.setState({ pageContent: null, shouldShow404: true })
    }
  }
  
  render() {
    const {
      root,
      nodesByParentId,
      shouldShow404,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    
    return (
      <React.Fragment>
        <Header>
          <HeaderContentContainer>
            <LinkStyled to="/">dubaniewi.cz</LinkStyled>
            <HeaderLinksContainer>
              {getSession()
                ? (
                  <React.Fragment>
                    <PublishPost>publish</PublishPost>
                    <EditPost to="/foo">edit</EditPost>
                    <DeletePost>delete</DeletePost>
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
