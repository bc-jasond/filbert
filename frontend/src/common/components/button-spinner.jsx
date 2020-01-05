import React from 'react';
import styled, { css } from 'styled-components';
import { sansSerif } from '../fonts.css';
import { NavButtonMixin } from './shared-styled-components';

import Spinner from './spinner';
import { bezier, blue, darkBlue, darkGrey, lightBlue, mediumGrey } from '../css';

/*!
 * Inspired by: Ladda
 * http://lab.hakim.se/ladda
 * MIT licensed
 *
 * Copyright (C) 2018 Hakim El Hattab, http://hakim.se
 */

const SpinnerStyled = styled(Spinner)`
  fill: white;
  position: absolute;
  z-index: 2;
  display: inline-block;
  opacity: 0;
  pointer-events: none;
  margin-top: 32px;
  width: 32px;
  height: 32px;
  ${bezier('all')}
  ${p =>
    p.loading &&
    `
    opacity: 1;
    margin-top: -2px;
  `}
`;
const ButtonLabel = styled.div`
  font-family: ${sansSerif};
  position: relative;
  z-index: 3;
  font-size: larger;
  color: inherit;
  ${bezier('opacity')}
  ${p =>
    p.loading &&
    css`
      opacity: 0;
      top: 1em;
    `}
`;
const Button = styled.button`
  ${NavButtonMixin};
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 100%;
  margin-bottom: 16px;
  ${bezier('all')};
  &:hover {
    background-color: ${p => p.primary && 'white'};
    color: ${p => p.primary && darkGrey};
  }
  ${p =>
    p.disabled &&
    css`
      background-color: ${mediumGrey};
      &:hover {
        background-color: ${mediumGrey};
      }
    `}
  ${p =>
    p.loading &&
    css`
      cursor: not-allowed;
      background-color: ${mediumGrey};
      &:hover {
        background-color: ${mediumGrey};
      }
    `}
`;

export default props => {
  const { label, loading, children, primary } = props;
  return (
    <Button disabled={loading ? 'disabled' : ''} primary={primary} loading={loading ? 'true' : undefined}>
      {children}
      <ButtonLabel loading={loading ? 'true' : undefined}>{label}</ButtonLabel>
      <SpinnerStyled loading={loading ? 'true' : undefined} />
    </Button>
  );
};
