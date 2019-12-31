import React from 'react';
import { Redirect } from 'react-router-dom';
import { fromJS, Map } from 'immutable';
import { PAGE_NAME_VIEW } from '../common/constants';
import { apiGet } from '../common/fetch';
import { reviver } from './edit/document-model';

import Header from './header';
import Footer from './footer';
import { Article } from '../common/components/layout-styled-components';

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
    const params = this.props?.params;
    const id = params?.canonical;
    const prevId = prevProps?.params?.canonical;
    if (id === prevId) {
      return;
    }
    await this.loadPost();
  }

  async loadPost() {
    try {
      const { post, contentNodes } = await apiGet(
        `/post/${this.props?.params?.canonical}`
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
    const {
      state: { post, nodesById, shouldShow404, shouldRedirectToHome },
      props: { session, setSession }
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
            <Document nodesById={nodesById} />
          </Article>
          <Footer />
        </>
      )
    );
  }
}
