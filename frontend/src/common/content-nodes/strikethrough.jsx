import React from 'react';
import {
  StrikeText,
} from '../shared-styled-components';

export default class StrikethroughNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get('isStrikethrough')
      ? (
        <StrikeText>{children}</StrikeText>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
