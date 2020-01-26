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
  caretIsAtEndOfInput,
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

  captionInputIdx = 4;

  menuItems = [
    {
      Component: IconImage,
      onClick: () => this.fileInputRef?.current?.click?.()
    },
    {
      Component: IconRotate,
      onClick: () =>
        this.props?.imageRotate(this.props?.nodeModel?.getIn?.(['meta', 'url']))
    },
    { Component: PlusPx, onClick: () => this.props?.imageResize?.(true) },
    { Component: MinusPx, onClick: () => this.props?.imageResize?.(false) }
  ];

  constructor(props) {
    super(props);
    this.state = {
      currentIdx: this.captionInputIdx
    };
  }

  componentDidMount() {
    const {
      props: { nodeModel }
    } = this;
    if (this.captionRef) {
      focusAndScrollSmooth(nodeModel.get('id'), this.captionRef?.current);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      state: { currentIdx },
      props: { nodeModel, windowEvent }
    } = this;
    const { currentIdx: prevIdx } = prevState;
    if (windowEvent && windowEvent !== prevProps.windowEvent) {
      this.handleKeyDown(windowEvent);
    }
    if (currentIdx === this.captionInputIdx) {
      focusAndScrollSmooth(
        nodeModel.get('id'),
        this.captionRef?.current,
        prevIdx !== this.captionInputIdx - 1
      );
      return;
    }
    this.captionRef?.current?.blur?.();
  }

  handleKeyDown = evt => {
    const {
      state: { currentIdx }
    } = this;

    if (
      evt.keyCode === KEYCODE_LEFT_ARROW &&
      (currentIdx < this.captionInputIdx || caretIsAtBeginningOfInput())
    ) {
      const nextIdx = currentIdx === 0 ? this.captionInputIdx : currentIdx - 1;
      this.setState({ currentIdx: nextIdx });
      stopAndPrevent(evt);
      return;
    }
    if (
      evt.keyCode === KEYCODE_RIGHT_ARROW &&
      (currentIdx < this.captionInputIdx || caretIsAtEndOfInput())
    ) {
      const nextIdx = currentIdx === this.captionInputIdx ? 0 : currentIdx + 1;
      this.setState({ currentIdx: nextIdx });
      stopAndPrevent(evt);
      return;
    }
    if (
      evt.keyCode === KEYCODE_SPACE &&
      currentIdx > -1 &&
      currentIdx < this.captionInputIdx
    ) {
      if (currentIdx > -1) {
        this.menuItems[currentIdx]?.onClick?.();
      }
      stopAndPrevent(evt);
    }
  };

  render() {
    const {
      props: { offsetTop, nodeModel, uploadFile, updateMeta },
      state: { currentIdx }
    } = this;

    return (
      <EditImageMenu data-is-menu top={offsetTop}>
        {this.menuItems.map(({ Component, onClick }, idx) => (
          <MenuItem
            key={Component.displayName}
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
