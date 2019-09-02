import React from 'react';
import {
  A,
} from '../shared-styled-components';
import { SELECTION_ACTION_LINK } from '../constants';

export default class LinkNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    const href = selection.get('linkUrl');
    return selection.get(SELECTION_ACTION_LINK)
      ? (
        <A href={href}>{children}</A>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
