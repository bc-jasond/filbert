import React from 'react';
import styled from 'styled-components';
import {
  backgroundColorPrimary,
  getVar,
  textColorSecondary,
} from '../../variables.css';
import { NODE_TYPE_PRE } from '../constants';
import { cleanTextOrZeroLengthPlaceholder } from '../utils';

const PreStyled = styled.pre`
  font: inherit;
  margin: 0;
  color: ${getVar(textColorSecondary)};
  &::before {
    display: inline-block;
    width: 35px;
    color: ${getVar(backgroundColorPrimary)};
    counter-increment: code;
    content: counter(code);
  }
`;

export default React.memo(({ node }) => {
  console.debug('Pre RENDER', node);
  return (
    <PreStyled data-type={NODE_TYPE_PRE} name={`${node.get('id')}`}>
      {cleanTextOrZeroLengthPlaceholder(node.get('content'))}
    </PreStyled>
  );
});
