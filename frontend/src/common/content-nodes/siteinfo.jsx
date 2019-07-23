import React from 'react';
import {
  SiteInfo,
} from '../shared-styled-components';

export default class SiteInfoNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get('isSiteInfo')
      ? (
        <SiteInfo>{children}</SiteInfo>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
