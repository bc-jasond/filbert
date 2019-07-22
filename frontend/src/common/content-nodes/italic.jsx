import React from 'react';
import {
  ItalicText,
} from '../shared-styled-components';

export default class ItalicNode extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  
  render() {
    const {
      selection,
      children,
    } = this.props;
    return selection.get('isItalic')
      ? (
        <ItalicText>{children}</ItalicText>
      ) : (
        <React.Fragment>{children}</React.Fragment>
      )
  }
}
