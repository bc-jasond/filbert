import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import {
  white,
  abramovTextWhite,
  accentColorPrimary,
  backgroundColorSecondary,
  boxShadow,
  getVar,
  outline,
} from '../../variables.css';
import { ease } from '../css';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;
const ToggleWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  position: relative;
  outline: ${(p) => p.isFocused && getVar(outline)};
  background-color: ${(p) =>
    p.value ? getVar(accentColorPrimary) : 'transparent'};
  ${ease('background-color')};
  padding-left: 1px;
  padding-right: 1px;
  margin-left: 8px;
  border-radius: 32px;
  border: 1px solid ${getVar(backgroundColorSecondary)};
  width: 64px;
  height: 34px;
  &:hover {
    cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  }
  ${(p) =>
    p.disabled &&
    css`
      background-color: ${getVar(backgroundColorSecondary)};
    `}
`;
const Knob = styled.div`
  position: absolute;
  left: 34px;
  ${ease('left')};
  background-color: ${abramovTextWhite};
  box-shadow: ${getVar(boxShadow)};
  border-radius: 50%;
  height: 32px;
  width: 32px;
  ${(p) =>
    !p.value &&
    css`
      left: 1px;
    `}
`;
const Label = styled.label`
  flex-grow: 2;
`;
const HiddenCheckbox = styled.input`
  position: absolute;
  height: 0;
  width: 0;
  opacity: 0;
`;

export default React.memo(({ value, onUpdate, label, children, disabled }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Wrapper>
      {children || <Label>{label}</Label>}
      <ToggleWrapper
        value={value}
        disabled={disabled}
        onClick={() => !disabled && onUpdate()}
        isFocused={isFocused}
      >
        <Knob value={value} />
        <HiddenCheckbox
          key={`checkbox${value}`}
          type="checkbox"
          checked={!!value}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={onUpdate}
        />
      </ToggleWrapper>
    </Wrapper>
  );
});
