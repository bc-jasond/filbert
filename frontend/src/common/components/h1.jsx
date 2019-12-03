import React from 'react';
import { NODE_TYPE_H1 } from '../constants';
import { cleanTextOrZeroLengthPlaceholder } from '../utils';
import { H1Styled } from './shared-styled-components';

export default class H1 extends React.PureComponent {
  render() {
    console.debug("H1 RENDER", this);
    const {
      node,
      shouldShowPlaceholder,
    } = this.props;
    return (
      <H1Styled
        data-type={NODE_TYPE_H1}
        name={node.get('id')}
        shouldShowPlaceholder={shouldShowPlaceholder}
      >
        {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
      </H1Styled>
    )
  }
}
