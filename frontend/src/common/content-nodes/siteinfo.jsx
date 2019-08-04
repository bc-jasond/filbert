import React from 'react';
import {
  SiteInfo,
} from '../shared-styled-components';
import { SELECTION_ACTION_SITEINFO } from '../constants';

export default class SiteInfoNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get(SELECTION_ACTION_SITEINFO)
      ? (
        <SiteInfo>{children}</SiteInfo>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
