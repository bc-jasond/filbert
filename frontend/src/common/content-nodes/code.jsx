import React from 'react';
import {
  Code,
} from '../shared-styled-components';
import { SELECTION_ACTION_CODE } from '../constants';

export default class CodeNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get(SELECTION_ACTION_CODE)
      ? (
        <Code>{children}</Code>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
