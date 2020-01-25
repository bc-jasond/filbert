import * as React from 'react';
import styled from 'styled-components';

import {
  Arrow,
  Cursor,
  DarkInput,
  IconButton,
  LilSassyMenu,
  PointClip,
  SvgIconMixin
} from '../../../common/components/shared-styled-components';
import IconImageSvg from '../../../../assets/icons/image.svg';
import IconRotateSvg from '../../../../assets/icons/rotate.svg';
import PlusPxSvg from '../../../../assets/icons/plus-px.svg';
import MinusPxSvg from '../../../../assets/icons/minus-px.svg';
import {
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SPACE
} from '../../../common/constants';
import { stopAndPrevent } from '../../../common/utils';
import {
  caretIsAtBeginningOfInput,
  focusAndScrollSmooth
} from '../../../common/dom';

const IconImage = styled(IconImageSvg)`
  ${SvgIconMixin};
`;
const IconRotate = styled(IconRotateSvg)`
  ${SvgIconMixin};
`;
const PlusPx = styled(PlusPxSvg)`
  ${SvgIconMixin};
  height: 28px;
  width: 28px;
`;
const MinusPx = styled(MinusPxSvg)`
  ${SvgIconMixin};
  height: 28px;
  width: 28px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;
export const EditImageMenu = styled(LilSassyMenu)`
  display: flex;
  align-items: center;
  justify-items: center;
  top: ${p => p.top + 10}px;
  width: 500px;
  margin: 0 auto;
  left: 50%;
  margin-left: -250px;
`;
export const ImageCaptionInput = styled(DarkInput)`
  margin: 0 8px;
`;

const MenuItem = ({ onClick, Styled, isSelected }) => (
  <IconButton onClick={onClick}>
    <Styled />
    {isSelected && <Cursor />}
  </IconButton>
);

export default class EditImageForm extends React.Component {
  captionRef = React.createRef();
  fileInputRef = React.createRef();

  menuItems = [
    { Component: IconImage, onClick: () => this.props.imageResize(true) },
    {
      Component: IconRotate,
      onClick: () =>
        this.props.imageRotate(this.props.nodeModel.getIn(['meta', 'url']))
    },
    { Component: PlusPx, onClick: () => this.props.imageResize(true) },
    { Component: MinusPx, onClick: () => this.props.imageResize(false) }
  ];

  constructor(props) {
    super(props);
    this.state = {
      currentIdx: 4
    };
  }

  handleKeyDown = evt => {
    const {
      state: { currentIdx }
    } = this;

    if (
      evt.keyCode === KEYCODE_LEFT_ARROW &&
      (currentIdx < 4 || caretIsAtBeginningOfInput())
    ) {
      this.setState({ currentIdx: Math.max(0, currentIdx - 1) });
      stopAndPrevent(evt);
      return;
    }
    if (evt.keyCode === KEYCODE_RIGHT_ARROW && currentIdx < 4) {
      // wrap currentIdx back to 0? input.isFocused() && caretIsAtBeginning) || ) {
      this.setState({ currentIdx: Math.min(8, currentIdx + 1) });
      stopAndPrevent(evt);
      return;
    }
    if (evt.keyCode === KEYCODE_SPACE && currentIdx > -1 && currentIdx < 4) {
      if (currentIdx > -1) {
        this.menuItems[currentIdx]?.onClick?.();
      }
      stopAndPrevent(evt);
    }
  };

  componentDidMount() {
    const {
      props: { nodeModel }
    } = this;
    if (this.captionRef) {
      focusAndScrollSmooth(nodeModel.get('id'), this.captionRef.current);
    }
  }

  componentDidUpdate(prevProps) {
    const {
      state: { currentIdx },
      props: { windowEvent }
    } = this;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
    if (currentIdx === 4) {
      this.captionRef?.current?.focus?.();
      return;
    }
    this.captionRef?.current?.blur?.();
  }

  render() {
    const {
      props: { offsetTop, nodeModel, uploadFile, updateMeta },
      state: { currentIdx }
    } = this;

    return (
      <EditImageMenu data-is-menu top={offsetTop}>
        {this.menuItems.map(({ Component, onClick }, idx) => (
          <MenuItem
            Styled={Component}
            onClick={onClick}
            isSelected={currentIdx === idx}
          />
        ))}
        <ImageCaptionInput
          id="image-caption-input"
          ref={this.captionRef}
          placeholder="Enter Image Caption here..."
          onChange={e => updateMeta('caption', e.target.value)}
          value={nodeModel.getIn(['meta', 'caption'], '')}
        />
        <PointClip>
          <Arrow />
        </PointClip>
        <HiddenFileInput
          name="hidden-image-upload-file-input"
          type="file"
          onChange={e => {
            uploadFile(e.target.files);
          }}
          accept="image/*"
          ref={this.fileInputRef}
        />
      </EditImageMenu>
    );
  }
}
