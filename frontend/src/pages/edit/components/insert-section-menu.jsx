import React from 'react';
import styled, { css } from 'styled-components';
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
  NODE_TYPE_SPACER
} from '../../../common/constants';

import { grey } from '../../../common/css';
import { NavButtonMixin } from '../../../common/components/shared-styled-components';
import { removeAllRanges, setCaret } from '../../../common/dom';
import { stopAndPrevent } from '../../../common/utils';

const InsertSectionMenu = styled.div`
  position: absolute;
  width: ${p => (p.isOpen ? '755' : '50')}px;
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
  transition: transform 0.2s ease-in-out;
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
    ${p =>
      p.isOpen &&
      `
      transform: rotateZ(225deg);
    `}
  }
  &:after {
    ${lineMixin}
    transform: rotateZ(90deg);
    ${p =>
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
  ${p =>
    !p.isOpen &&
    `
    left: -100%;
    display: none;
    transition: none;
  `}
`;
const InsertSectionItem = styled.span`
  ${NavButtonMixin};
`;

export default class InsertSectionMenuComponent extends React.Component {
  fileInputRef = React.createRef();

  didHitShift = false;

  sectionTypes = [
    {
      type: NODE_TYPE_H1,
      children: 'H1',
      callback: () => this.props?.insertSection?.(NODE_TYPE_H1)
    },
    {
      type: NODE_TYPE_H2,
      children: 'H2',
      callback: () => this.props?.insertSection?.(NODE_TYPE_H2)
    },
    {
      type: NODE_TYPE_PRE,
      children: 'code',
      callback: () => this.props?.insertSection?.(NODE_TYPE_PRE)
    },
    {
      type: NODE_TYPE_LI,
      children: 'list',
      callback: () => this.props?.insertSection?.(NODE_TYPE_LI)
    },
    {
      type: NODE_TYPE_SPACER,
      children: 'spacer',
      callback: () => this.props?.insertSection?.(NODE_TYPE_SPACER)
    },
    {
      type: NODE_TYPE_IMAGE,
      children: (
        <>
          photo
          <HiddenFileInput
            name="hidden-image-upload-file-input"
            type="file"
            onChange={e => {
              this.props?.insertSection?.(NODE_TYPE_IMAGE, e.target.files);
            }}
            accept="image/*"
            ref={this.fileInputRef}
          />
        </>
      ),
      callback: () => this.fileInputRef.current.click()
    },
    {
      type: NODE_TYPE_QUOTE,
      children: 'quote',
      callback: () => this.props?.insertSection?.(NODE_TYPE_QUOTE)
    }
  ];

  constructor(props) {
    super(props);

    this.state = {
      currentIdx: -1,
      menuIsOpen: false
    };
  }

  componentDidUpdate(prevProps) {
    const {
      props: { windowEvent }
    } = this;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
  }

  focusInsertNode = () => {
    const {
      props: { insertNodeId }
    } = this;
    setCaret({ startNodeId: insertNodeId });
  };

  handleKeyDown = evt => {
    // don't let contenteditable take over!
    stopAndPrevent(evt);

    const {
      state: { currentIdx }
    } = this;

    /* eslint-disable-next-line default-case */
    switch (evt.keyCode) {
      case KEYCODE_CTRL: {
        if (this.didHitShift) {
          // user double-tapped shift
          this.setState({ menuIsOpen: true });
          this.didHitShift = false;
          // clear the caret, it's just dangling around some random place like a piece of spinach in your teeth
          removeAllRanges();
          return;
        }
        this.didHitShift = true;
        setTimeout(() => {
          this.didHitShift = false;
        }, 500);
        return;
      }
      case KEYCODE_LEFT_ARROW: {
        this.setState({ currentIdx: Math.max(0, currentIdx - 1) });
        break;
      }
      case KEYCODE_RIGHT_ARROW: {
        this.setState({ currentIdx: Math.min(6, currentIdx + 1) });
        break;
      }
      case KEYCODE_ESC: {
        this.setState({ currentIdx: -1, menuIsOpen: false });
        this.focusInsertNode();
        return;
      }
      case KEYCODE_SPACE: // fall-through
      case KEYCODE_ENTER: {
        if (currentIdx > -1) {
          this.setState({ currentIdx: -1, menuIsOpen: false }, () => {
            this.sectionTypes[currentIdx]?.callback?.();
          });
        }
      }
    }
  };

  toggleMenu = () => {
    const {
      props: { insertNodeId },
      state: { menuIsOpen: menuWasOpen }
    } = this;

    this.setState({ menuIsOpen: !menuWasOpen }, () => {
      if (menuWasOpen) {
        // now it will be closed, replace caret
        setCaret({ startNodeId: insertNodeId });
      } else {
        // now it will be open, hide caret
        removeAllRanges();
      }
    });
  };

  render() {
    const {
      props: { insertMenuTopOffset, insertMenuLeftOffset },
      state: { currentIdx, menuIsOpen }
    } = this;

    return (
      <InsertSectionMenu
        name="insert-section-menu"
        isOpen={menuIsOpen}
        topOffset={insertMenuTopOffset}
        leftOffset={insertMenuLeftOffset}
        onKeyDown={this.handleKeyDown}
      >
        <InsertSectionMenuButton
          onClick={this.toggleMenu}
          isOpen={menuIsOpen}
        />
        <InsertSectionMenuItemsContainer
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          isOpen={menuIsOpen}
        >
          {this.sectionTypes.map(({ type, children, callback }, idx) => (
            <InsertSectionItem
              key={type}
              isOpen={currentIdx === idx}
              onClick={callback}
              onMouseOver={() => this.setState({ currentIdx: -1 })}
              onFocus={() => {}}
            >
              {children}
            </InsertSectionItem>
          ))}
        </InsertSectionMenuItemsContainer>
      </InsertSectionMenu>
    );
  }
}
