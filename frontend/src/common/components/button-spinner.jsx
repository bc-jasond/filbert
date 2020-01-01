import React from 'react';
import styled, { css } from 'styled-components';
import { sansSerif } from '../fonts.css';

import Spinner from './spinner';
import { bezier, blue, darkBlue, lightBlue, mediumGrey } from '../css';

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
  display: flex;
  justify-content: center;
  overflow: hidden;
  position: relative;
  border-radius: 26px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  width: 100%;
  margin-bottom: 16px;
  background: ${p => (p.primary ? blue : 'white')};
  padding: 14px 18px;
  font-size: 18px;
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-appearance: none;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  ${bezier('all')};
  &:hover {
    background: ${p => (p.primary ? darkBlue : lightBlue)};
    color: white;
  }
  ${p =>
    p.disabled &&
    css`
      background: ${mediumGrey};
      &:hover {
        background: ${mediumGrey};
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
  const { label, loading, children } = props;
  return (
    <Button disabled={loading ? 'disabled' : ''} loading={loading}>
      {children}
      <ButtonLabel loading={loading}>{label}</ButtonLabel>
      <SpinnerStyled loading={loading ? 'true' : undefined} />
    </Button>
  );
};
