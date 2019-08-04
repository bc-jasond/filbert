import React from 'react';
import {
  BoldText,
} from '../shared-styled-components';
import { SELECTION_ACTION_BOLD } from '../constants';

export default class BoldNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get(SELECTION_ACTION_BOLD)
      ? (
        <BoldText>{children}</BoldText>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
