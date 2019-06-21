import styled, { css } from 'styled-components';
import { grey } from '../../common/css';
import { HeaderButtonMixin } from '../../common/layout-styled-components';

export const InsertSectionMenu = styled.div`
  position: absolute;
  overflow: hidden;
  height: 56px;
  width: ${p => p.isOpen ? '755' : '50'}px;
  display: ${p => p.shouldShowInsertMenu ? 'block' : 'none'};
  top: ${p => p.insertMenuTopOffset - 13}px;
  left: ${p => p.insertMenuLeftOffset - 68}px;
`;
const lineMixin = css`
  z-index: 2;
  position: absolute;
  display: block;
  content: '';
  height: 2px;
  width: 20px;
  background-color: ${grey};
  transition: transform .2s ease-in-out;
`;
export const InsertSectionMenuButton = styled.button`
  position: absolute;
  top: 16px;
  z-index: 3;
  width: 24px;
  height: 24px;
  display: block;
  cursor: pointer;
  border: 0;
  outline: 0;
  background: transparent;
  &:before {
    ${lineMixin}
    transform: rotateZ(0deg);
    ${p => p.isOpen && `
      transform: rotateZ(225deg);
    `}
  }
  &:after {
    ${lineMixin}
    transform: rotateZ(90deg);
    ${p => p.isOpen && `
      transform: rotateZ(-45deg);
    `}
  }
`;
export const InsertSectionMenuItemsContainer = styled.div`
  position: absolute;
  top: 16px;
  height: 24px;
  left: 48px;
  display: block;
  transition: left .2s ease-in-out, display .2 ease-in-out;
  ${p => !p.isOpen && `
    left: -100%;
    display: none;
    transition: none;
  `}
`;
export const InsertSectionItem = styled.span`
  ${HeaderButtonMixin};
`;
