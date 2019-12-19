import React from 'react';
import { NODE_TYPE_PRE } from '../constants';
import { cleanTextOrZeroLengthPlaceholder } from '../utils';
import { PreStyled } from './shared-styled-components';

export default class Pre extends React.PureComponent {
  render() {
    console.debug('Pre RENDER', this);
    const {
      props: { node }
    } = this;
    return (
      <PreStyled data-type={NODE_TYPE_PRE} name={`${node.get('id')}`}>
        {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
      </PreStyled>
    );
  }
}
