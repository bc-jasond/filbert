import React from 'react';
import Immutable from 'immutable';
import { apiGet } from '../common/fetch';

import Page404 from './404';

import ContentNode from '../common/content-node.component';

export default class ViewPost extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      root: null,
      allNodesByParentId: {},
      shouldShow404: false,
    }
  }
  
  async componentDidMount() {
    try {
      const { post, contentNodes } = await apiGet(`/post/${this.props.postId}`);
      // TODO: don't use 'null' as root node indicator
      const allNodesByParentId = Immutable.fromJS(contentNodes);
      const root = allNodesByParentId.get('null').get(0);
      this.setState({ root, allNodesByParentId, shouldShow404: false })
    } catch (err) {
      console.log(err);
      this.setState({ pageContent: null, shouldShow404: true })
    }
  }
  
  render() {
    const {
      root,
      allNodesByParentId,
      shouldShow404,
    } = this.state;
    
    if (shouldShow404) return (<Page404 />);
    
    return !root ? null : (
      <ContentNode node={root} allNodesByParentId={allNodesByParentId} />
    );
  }
}
