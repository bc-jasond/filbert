import React from 'react';
import { Redirect } from 'react-router-dom';
import { fromJS, Map } from 'immutable';
import { apiGet } from '../common/fetch';
import { getSession, getUserName, signout } from '../common/session';
import { reviver } from './edit/document-model';

import Footer from './footer';
import {
  Article,
  EditPost,
  Header,
  HeaderContentContainer,
  HeaderLinksContainer,
  HeaderSpacer,
  LinkStyledSignIn,
  ListDrafts,
  LogoLinkStyled,
  NewPost,
  SignedInUser
} from '../common/components/layout-styled-components';

import Page404 from './404';

import Document from '../common/components/document.component';

export default class ViewPost extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      post: Map(),
      nodesById: Map(),
      shouldShow404: false,
      shouldRedirectToHome: false
    };
  }

  async componentDidMount() {
    await this.loadPost();
  }

  async componentDidUpdate(prevProps) {
    const params = this.props?.match?.params;
    const id = params?.canonical;
    const prevId = prevProps?.match?.params?.canonical;
    if (id === prevId) {
      return;
    }
    await this.loadPost();
  }

  async loadPost() {
    try {
      const { post, contentNodes } = await apiGet(
        `/post/${this.props?.match?.params?.canonical}`
      );
      this.setState({
        post: fromJS(post),
        nodesById: fromJS(contentNodes, reviver),
        shouldShow404: false
      });
    } catch (err) {
      console.error(err);
      this.setState({ shouldShow404: true });
    }
  }

  render() {
    const { post, nodesById, shouldShow404, shouldRedirectToHome } = this.state;

    if (shouldShow404) return <Page404 />;
    if (shouldRedirectToHome) return <Redirect to="/" />;

    return (
      <>
        <Header>
          <HeaderContentContainer>
            <LogoLinkStyled to="/">
              <span role="img" aria-label="hand writing with a pen">
                ✍️
              </span>{' '}
              filbert
            </LogoLinkStyled>
            <HeaderLinksContainer>
              {getSession() ? (
                <>
                  {post.get('canEdit') && (
                    <EditPost to={`/edit/${post.get('id')}`}>edit</EditPost>
                  )}
                  <NewPost to="/edit/new">new</NewPost>
                  <ListDrafts to="/drafts">drafts</ListDrafts>
                  <SignedInUser
                    onClick={() => {
                      if (confirm('Logout?')) {
                        signout();
                        // TODO: do something with state/props here?
                        window.location.reload();
                      }
                    }}
                  >
                    {getUserName()}
                  </SignedInUser>
                </>
              ) : (
                <LinkStyledSignIn to="/signin">sign in</LinkStyledSignIn>
              )}
            </HeaderLinksContainer>
          </HeaderContentContainer>
        </Header>
        <HeaderSpacer />
        <Article>
          {nodesById.size > 0 && <Document nodesById={nodesById} />}
        </Article>
        <Footer />
      </>
    );
  }
}
