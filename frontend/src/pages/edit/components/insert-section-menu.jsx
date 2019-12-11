import React from 'react';
import {
  NODE_TYPE_LI,
  NODE_TYPE_PRE,
  NODE_TYPE_H1,
  NODE_TYPE_H2,
  NODE_TYPE_IMAGE,
  NODE_TYPE_QUOTE,
  NODE_TYPE_SPACER,
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SHIFT_OR_COMMAND_LEFT,
  KEYCODE_SHIFT_RIGHT,
  KEYCODE_ESC,
  KEYCODE_ENTER,
  KEYCODE_SPACE
} from '../../../common/constants';

import styled, { css } from 'styled-components';
import { grey } from '../../../common/css';
import { NavButtonMixin } from '../../../common/components/shared-styled-components';
import { removeAllRanges, setCaret } from '../../../common/dom';

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
  z-index: 13; // same as lil black menu
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
  constructor(props) {
    super(props);

    this.state = {
      currentIdx: -1
    };
    this.insertSectionCb = this.props.insertSection;
  }

  fileInputRef = React.createRef();
  didHitShift = false;
  sectionTypes = [
    [NODE_TYPE_H1, 'H1', () => this.insertSectionCb(NODE_TYPE_H1)],
    [NODE_TYPE_H2, 'H2', () => this.insertSectionCb(NODE_TYPE_H2)],
    [NODE_TYPE_PRE, 'code', () => this.insertSectionCb(NODE_TYPE_PRE)],
    [NODE_TYPE_LI, 'list', () => this.insertSectionCb(NODE_TYPE_LI)],
    [NODE_TYPE_SPACER, 'spacer', () => this.insertSectionCb(NODE_TYPE_SPACER)],
    [
      NODE_TYPE_IMAGE,
      <React.Fragment>
        photo
        <HiddenFileInput
          name="hidden-image-upload-file-input"
          type="file"
          onChange={e => {
            this.insertSectionCb(NODE_TYPE_IMAGE, e.target.files);
          }}
          accept="image/*"
          ref={this.fileInputRef}
        />
      </React.Fragment>,
      () => this.fileInputRef.current.click()
    ],
    [NODE_TYPE_QUOTE, 'quote', () => this.insertSectionCb(NODE_TYPE_QUOTE)]
  ];

  focusInsertNode = () => {
    const { insertNodeId } = this.props;
    setCaret(insertNodeId);
  };

  handleKeyDown = evt => {
    const { currentIdx } = this.state;

    switch (evt.keyCode) {
      case KEYCODE_SHIFT_OR_COMMAND_LEFT: //fall-through
      case KEYCODE_SHIFT_RIGHT: {
        if (this.didHitShift) {
          // user double-tapped shift
          this.setState({ currentIdx: 0 });
          this.didHitShift = false;
          // clear the caret, it's just dangling around some random place like a piece of spinach in your teeth
          removeAllRanges();
          return;
        }
        this.didHitShift = true;
        setTimeout(() => (this.didHitShift = false), 500);
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
        this.setState({ currentIdx: -1 });
        this.focusInsertNode();
        return;
      }
      case KEYCODE_SPACE: //fall-through
      case KEYCODE_ENTER: {
        if (currentIdx > -1) {
          const [_, __, cb] = this.sectionTypes[currentIdx];
          cb();
          // don't let contenteditable take over!
          evt.preventDefault();
          evt.stopPropagation();
        }
        return;
      }
      default: {
      }
    }
  };

  toggleMenu = () => {
    const { insertNodeId } = this.props;
    const { currentIdx } = this.state;
    const shouldOpen = currentIdx === -1;
    this.setState({ currentIdx: shouldOpen ? 0 : -1 }, () => {
      if (shouldOpen) {
        removeAllRanges();
      } else {
        setCaret(insertNodeId);
      }
    });
  };

  componentDidUpdate(prevProps) {
    const { windowEvent } = this.props;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
  }

  render() {
    const { insertMenuTopOffset, insertMenuLeftOffset } = this.props;
    const { currentIdx } = this.state;

    return (
      <InsertSectionMenu
        name="insert-section-menu"
        isOpen={currentIdx > -1}
        topOffset={insertMenuTopOffset}
        leftOffset={insertMenuLeftOffset}
        onKeyDown={this.handleKeyDown}
      >
        <InsertSectionMenuButton
          onClick={this.toggleMenu}
          isOpen={currentIdx > -1}
        />
        <InsertSectionMenuItemsContainer
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          isOpen={currentIdx > -1}
        >
          {this.sectionTypes.map(([type, children, callback], idx) => (
            <InsertSectionItem
              key={type}
              isOpen={currentIdx === idx}
              onClick={callback}
            >
              {children}
            </InsertSectionItem>
          ))}
        </InsertSectionMenuItemsContainer>
      </InsertSectionMenu>
    );
  }
}
