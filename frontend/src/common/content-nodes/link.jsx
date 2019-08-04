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
      href,
      selection,
      children,
    } = this.props;
    return selection.get(SELECTION_ACTION_LINK)
      ? (
        <A href={href}>{children}</A>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
