import React from 'react';
import {
  Code,
} from '../shared-styled-components';

export default class CodeNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get('isCode')
      ? (
        <Code>{children}</Code>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
