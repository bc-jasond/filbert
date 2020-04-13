import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { navButtonMixin } from '../../../common/components/shared-styled-components-mixins';
import {
  KEYCODE_CTRL,
  KEYCODE_ENTER,
  KEYCODE_ESC,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SPACE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
} from '../../../common/constants';

import { removeAllRanges, setCaret } from '../../../common/dom';
import { stopAndPrevent } from '../../../common/utils';
import { getVar, grey, outline } from '../../../variables.css';

const InsertSectionMenu = styled.div`
  position: absolute;
  width: ${(p) => (p.isOpen ? '755' : '50')}px;
  display: block;
  top: ${(p) => p.topOffset + 52}px;
  left: ${(p) => p.leftOffset - 68}px;
`;
const lineMixin = css`
  z-index: 2;
  position: absolute;
  display: block;
  content: '';
  height: 2px;
  width: 20px;
  background-color: ${grey};
  transition: transform 0.2s ease-in-out;
`;
const InsertSectionMenuButton = styled.button`
  position: absolute;
  top: 15px;
  z-index: 3;
  width: 24px;
  height: 24px;
  display: block;
  cursor: pointer;
  border: 0;
  outline: 0; // ${getVar(outline)};
  background: transparent;
  &:before {
    ${lineMixin};
    transform: rotateZ(0deg);
    ${(p) =>
      p.isOpen &&
      `
      transform: rotateZ(225deg);
    `}
  }
  &:after {
    ${lineMixin};
    transform: rotateZ(90deg);
    ${(p) =>
      p.isOpen &&
      `
      transform: rotateZ(-45deg);
    `}
  }
`;
const HiddenFileInput = styled.input`
  display: none;
`;
const InsertSectionMenuItemsContainer = styled.div`
  position: absolute;
  z-index: 13; // same as lil menu
  top: 16px;
  min-height: 24px;
  left: 48px;
  display: block;
  transition: left 0.2s ease-in-out, display 0.2 ease-in-out;
  ${(p) =>
    !p.isOpen &&
    `
    left: -100%;
    display: none;
    transition: none;
  `}
`;
const InsertSectionItem = styled.span`
  ${navButtonMixin};
`;

export default React.memo(
  ({
    insertSection,
    insertNodeId,
    insertMenuTopOffset,
    insertMenuLeftOffset,
  }) => {
    const fileInputRef = useRef(null);
    const didHitShift = useRef(false);

    const [currentIdx, setCurrentIdx] = useState(-1);
    const [menuIsOpen, setMenuIsOpen] = useState(false);

    const sectionTypes = [
      {
        type: NODE_TYPE_H1,
        children: 'H1',
        callback: () => insertSection(NODE_TYPE_H1),
      },
      {
        type: NODE_TYPE_H2,
        children: 'H2',
        callback: () => insertSection(NODE_TYPE_H2),
      },
      {
        type: NODE_TYPE_PRE,
        children: 'code',
        callback: () => insertSection(NODE_TYPE_PRE),
      },
      {
        type: NODE_TYPE_LI,
        children: 'list',
        callback: () => insertSection(NODE_TYPE_LI),
      },
      {
        type: NODE_TYPE_SPACER,
        children: 'spacer',
        callback: () => insertSection(NODE_TYPE_SPACER),
      },
      {
        type: NODE_TYPE_IMAGE,
        children: (
          <>
            photo
            <HiddenFileInput
              id="edit-image-hidden-file-input"
              type="file"
              onChange={(e) => {
                insertSection(NODE_TYPE_IMAGE, e.target.files);
              }}
              onClick={(e) => {
                // NOTE: the callback below will be called again without this stopPropagation()
                e.stopPropagation();
              }}
              accept="image/*"
              ref={fileInputRef}
            />
          </>
        ),
        callback: () => fileInputRef.current.click(),
      },
      {
        type: NODE_TYPE_QUOTE,
        children: 'quote',
        callback: () => insertSection(NODE_TYPE_QUOTE),
      },
    ];

    useEffect(() => {
      function handleKeyDown(evt) {
        if (!evt) {
          return;
        }

        // eslint-disable-next-line default-case
        switch (evt.keyCode) {
          case KEYCODE_CTRL: {
            if (didHitShift.current) {
              // user double-tapped shift
              setMenuIsOpen(true);
              setCurrentIdx(0);
              didHitShift.current = false;
              // clear the caret, it's just dangling around some random place like a piece of spinach in your teeth
              removeAllRanges();
              stopAndPrevent(evt);
              break;
            }
            didHitShift.current = true;
            setTimeout(() => {
              didHitShift.current = false;
            }, 500);
            stopAndPrevent(evt);
            break;
          }
          case KEYCODE_LEFT_ARROW: {
            const nextIdx = currentIdx <= 0 ? 6 : currentIdx - 1;
            setCurrentIdx(nextIdx);
            stopAndPrevent(evt);
            break;
          }
          case KEYCODE_RIGHT_ARROW: {
            const nextIdx = currentIdx === 6 ? 0 : currentIdx + 1;
            setCurrentIdx(nextIdx);
            stopAndPrevent(evt);
            break;
          }
          case KEYCODE_ESC: {
            setCurrentIdx(-1);
            setMenuIsOpen(false);
            setCaret({ startNodeId: insertNodeId });
            stopAndPrevent(evt);
            break;
          }
          case KEYCODE_SPACE: // fall-through
          case KEYCODE_ENTER: {
            if (currentIdx > -1) {
              sectionTypes[currentIdx].callback();
              setCurrentIdx(-1);
              setMenuIsOpen(false);
            }
            stopAndPrevent(evt);
            break;
          }
          default:
            break;
        }
      }
      // `capture: true` will put this event handler in front of the ones set by edit.jsx
      window.addEventListener('keydown', handleKeyDown, { capture: true });
      return () => {
        window.removeEventListener('keydown', handleKeyDown, {
          capture: true,
        });
      };
    }, [currentIdx, insertNodeId, sectionTypes]);

    function toggleMenu() {
      setMenuIsOpen(!menuIsOpen);
      if (menuIsOpen) {
        // now it will be closed, replace caret
        setCaret({ startNodeId: insertNodeId });
      } else {
        // now it will be open, hide caret
        removeAllRanges();
      }
    }

    return (
      <InsertSectionMenu
        id="insert-section-menu"
        isOpen={menuIsOpen}
        topOffset={insertMenuTopOffset}
        leftOffset={insertMenuLeftOffset}
      >
        <InsertSectionMenuButton
          id="insert-section-menu-button"
          onClick={toggleMenu}
          isOpen={menuIsOpen}
        />
        <InsertSectionMenuItemsContainer
          id="insert-section-menu-container"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          isOpen={menuIsOpen}
        >
          {sectionTypes.map(({ type, children, callback }, idx) => (
            <InsertSectionItem
              id={`insert-section-menu-item-${type}`}
              key={type}
              isOpen={currentIdx === idx}
              onClick={callback}
              onMouseOver={() => setCurrentIdx(-1)}
              onFocus={() => {}}
            >
              {children}
            </InsertSectionItem>
          ))}
        </InsertSectionMenuItemsContainer>
      </InsertSectionMenu>
    );
  }
);
