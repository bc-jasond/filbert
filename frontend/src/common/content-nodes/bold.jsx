import React from 'react';
import {
  BoldText,
} from '../shared-styled-components';

export default class BoldNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get('isBold')
      ? (
        <BoldText>{children}</BoldText>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
