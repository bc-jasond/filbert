import React from 'react';
import {
  StrikeText,
} from '../shared-styled-components';
import { SELECTION_ACTION_STRIKETHROUGH } from '../constants';

export default class StrikethroughNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get(SELECTION_ACTION_STRIKETHROUGH)
      ? (
        <StrikeText>{children}</StrikeText>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
