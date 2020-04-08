import styled, { css } from 'styled-components';
import {
  accentColorPrimary,
  backgroundColorSecondary,
  getVar,
  lightBlue,
  outline,
  viewport7,
  viewport9,
} from '../../variables.css';
import { Col, H2Styled, H3Styled, Input } from './shared-styled-components';
import { navButtonMixin } from './shared-styled-components-mixins';

export const StyledH2 = styled(H2Styled)`
  margin-left: 0;
  margin-right: 0;
`;
export const StyledH3 = styled(H3Styled)`
  margin-left: 0;
  margin-right: 0;
  font-weight: normal;
`;
export const BaseRow = styled.div`
  max-width: ${viewport7};
  padding: 16px 0;
  border-top: 1px solid ${getVar(backgroundColorSecondary)};
  word-wrap: break-word;
  word-break: break-word;
  &:first-of-type {
    border: none;
    padding-top: 0;
  }
  &:last-of-type {
    margin-bottom: 42px;
  }
  @media (min-width: ${viewport7}) {
    margin: 0 auto;
  }
  ${(p) =>
    p.loading &&
    css`
      opacity: 0.3;
    `}
`;
export const ColFilter = styled(Col)`
  display: flex;
  padding-bottom: 16px;
  white-space: nowrap;
  &:last-of-type {
    padding-bottom: 0;
  }
  @media (min-width: ${viewport9}) {
    &:last-of-type {
      padding-bottom: 16px;
    }
  }
`;
export const Filter = styled.button`
  ${navButtonMixin};
  display: inline-block;
  padding: 9px;
  margin-left: 8px;
  &:first-of-type {
    margin-left: 0;
  }
`;
export const FilterWithInput = styled(Filter)`
  flex-grow: 0;
  border: 1px solid transparent;
  border-right: none;
  margin-right: 0;
  ${(p) =>
    p.isOpen &&
    css`
      border: 1px solid ${getVar(accentColorPrimary)};
      border-right: none;
      margin-right: 0;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    `}
`;
export const FilterInput = styled(Input)`
  flex: 1;
  height: 38px;
  margin-right: 8px;
  transition: opacity 0.2s;
  opacity: 1;
  //outline: ${getVar(outline)};
  border: 1px solid ${lightBlue};
  border-left: none;
  border-radius: 0 26px 26px 0;
  ${(p) =>
    p.shouldHide &&
    css`
      opacity: 0;
    `}
`;
