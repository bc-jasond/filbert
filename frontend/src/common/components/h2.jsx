import React from 'react';
import { NODE_TYPE_H2 } from '../constants';
import { cleanTextOrZeroLengthPlaceholder } from '../utils';
import { H2Styled } from './shared-styled-components';

export default class H2 extends React.PureComponent {
  render() {
    console.debug('H2 RENDER', this);
    const {
      props: { node },
    } = this;
    return (
      <H2Styled data-type={NODE_TYPE_H2} name={node.get('id')}>
        {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
      </H2Styled>
    );
  }
}
