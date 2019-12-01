import React from 'react';
import {
  NODE_TYPE_OL,
  NODE_TYPE_CODE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
} from '../../../common/constants';

import styled, { css } from 'styled-components';
import { grey } from '../../../common/css';
import { Input, NavButtonMixin } from '../../../common/components/shared-styled-components';

const InsertSectionMenu = styled.div`
  position: absolute;
  width: ${p => p.isOpen ? '755' : '50'}px;
  display: block;
  top: ${p => p.topOffset + 52}px;
  left: ${p => p.leftOffset - 68}px;
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
const InsertSectionMenuButton = styled.button`
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
const HiddenFileInput = styled.input`
  display: none;
`;
const InsertSectionMenuItemsContainer = styled.div`
  position: absolute;
  z-index: 13; // same as lil black menu
  top: 16px;
  min-height: 24px;
  left: 48px;
  display: block;
  transition: left .2s ease-in-out, display .2 ease-in-out;
  ${p => !p.isOpen && `
    left: -100%;
    display: none;
    transition: none;
  `}
`;
const InsertSectionItem = styled.span`
  ${NavButtonMixin};
`;

const fileInputRef = React.createRef();

export default ({
                  shouldShowInsertMenu,
                  insertMenuTopOffset,
                  insertMenuLeftOffset,
                  toggleInsertMenu,
                  insertMenuIsOpen,
                  insertSection,
                }) => (
  <InsertSectionMenu name="insert-section-menu" isOpen={insertMenuIsOpen}
                     shouldShowInsertMenu={shouldShowInsertMenu}
                     topOffset={insertMenuTopOffset}
                     leftOffset={insertMenuLeftOffset}>
    <InsertSectionMenuButton onClick={toggleInsertMenu}
                             isOpen={insertMenuIsOpen} />
    <InsertSectionMenuItemsContainer autocomplete="off" autocorrect="off" autocapitalize="off"
                                     spellcheck="false" isOpen={insertMenuIsOpen}>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_H1)}>H1</InsertSectionItem>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_H2)}>H2</InsertSectionItem>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_CODE)}>code</InsertSectionItem>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_OL)}>list</InsertSectionItem>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_SPACER)}>spacer</InsertSectionItem>
      <InsertSectionItem onClick={() => fileInputRef.current.click()}>
        photo
        <HiddenFileInput name="hidden-image-upload-file-input"
                         type="file"
                         onChange={(e) => {
                           insertSection(NODE_TYPE_IMAGE, e.target.files)
                         }}
                         accept="image/*"
                         ref={fileInputRef} />
      </InsertSectionItem>
      <InsertSectionItem onClick={() => insertSection(NODE_TYPE_QUOTE)}>quote</InsertSectionItem>
    </InsertSectionMenuItemsContainer>
  </InsertSectionMenu>
)
