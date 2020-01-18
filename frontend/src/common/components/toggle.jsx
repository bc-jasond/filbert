import React from 'react';
import styled, { css } from 'styled-components';
import { boxShadow, ease, lightBlue, lightGrey, outline } from '../css';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;
const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  outline: ${p => p.isFocused && outline};
  background-color: ${p => (p.value ? lightBlue : 'transparent')};
  ${ease('background-color')};
  padding-left: 1px;
  padding-right: 1px;
  margin-left: 8px;
  border-radius: 32px;
  border: 1px solid ${lightGrey};
  width: 64px;
  height: 34px;
  &:hover {
    cursor: pointer;
  }
`;
const Knob = styled.div`
  position: absolute;
  left: 34px;
  ${ease('left')};
  background-color: white;
  box-shadow: ${boxShadow};
  border-radius: 50%;
  height: 32px;
  width: 32px;
  ${p =>
    !p.value &&
    css`
      left: 1px;
    `}
`;
const Label = styled.label``;
const HiddenCheckbox = styled.input`
  opacity: 0;
`;

export default class extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isFocused: false
    };
  }

  render() {
    const {
      props: { value, onUpdate, label, children },
      state: { isFocused }
    } = this;
    return (
      <Wrapper>
        {children || <Label>{label}</Label>}
        <ToggleWrapper value={value} onClick={onUpdate} isFocused={isFocused}>
          <Knob value={value} />
        </ToggleWrapper>
        <HiddenCheckbox
          key={`checkbox${value}`}
          type="checkbox"
          checked={!!value}
          onFocus={() => this.setState({ isFocused: true })}
          onBlur={() => this.setState({ isFocused: false })}
          onChange={onUpdate}
        />
      </Wrapper>
    );
  }
}
