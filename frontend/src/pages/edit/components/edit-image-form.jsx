import { Map } from 'immutable';
import * as React from 'react';
import styled from 'styled-components';

import {
  Arrow,
  Cursor,
  DarkInput,
  IconButton,
  LilSassyMenu,
  PointClip
} from '../../../common/components/shared-styled-components';
import IconImageSvg from '../../../../assets/icons/image.svg';
import IconRotateSvg from '../../../../assets/icons/rotate.svg';
import PlusPxSvg from '../../../../assets/icons/plus-px.svg';
import MinusPxSvg from '../../../../assets/icons/minus-px.svg';
import { svgIconMixin } from '../../../common/components/shared-styled-components-mixins';
import {
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SPACE
} from '../../../common/constants';
import { uploadImage } from '../../../common/fetch';
import { stopAndPrevent } from '../../../common/utils';
import {
  caretIsAtBeginningOfInput,
  caretIsAtEndOfInput,
  focusAndScrollSmooth,
  getImageFileFormData
} from '../../../common/dom';

const IconImage = styled(IconImageSvg)`
  ${svgIconMixin};
`;
const IconRotate = styled(IconRotateSvg)`
  ${svgIconMixin};
`;
const PlusPx = styled(PlusPxSvg)`
  ${svgIconMixin};
  height: 28px;
  width: 28px;
`;
const MinusPx = styled(MinusPxSvg)`
  ${svgIconMixin};
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
  width: ${p => (p.shouldHideCaption ? '162px' : '500px')};
  margin: 0 auto;
  left: ${p => (p.left ? `${p.left}px` : '50%')};
  margin-left: ${p => (p.shouldHideCaption ? '-81px' : '-250px')};
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
      onClick: () => this.imageRotate()
    },
    { Component: PlusPx, onClick: () => this.imageResize(true) },
    { Component: MinusPx, onClick: () => this.imageResize(false) }
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

  replaceImageFile = async ([firstFile]) => {
    const {
      props: { post, nodeModel, update }
    } = this;
    if (!firstFile) {
      // TODO: user hit cancel in the file dialog?
      return;
    }
    const { error, data: imageMeta } = await uploadImage(
      getImageFileFormData(firstFile, post)
    );
    if (error) {
      console.error('Image Upload Error: ', error);
      return;
    }
    const updatedNodeModel = nodeModel
      .delete('meta')
      .set('meta', Map(imageMeta));
    update?.(updatedNodeModel);
  };

  imageRotate = () => {
    const {
      props: { nodeModel, update }
    } = this;
    const currentRotationDegrees = nodeModel.getIn(
      ['meta', 'rotationDegrees'],
      0
    );
    const updatedRotationDegrees =
      currentRotationDegrees === 270 ? 0 : currentRotationDegrees + 90;
    const updatedNodeModel = nodeModel.setIn(
      ['meta', 'rotationDegrees'],
      updatedRotationDegrees
    );
    update?.(updatedNodeModel);
  };

  imageResize = shouldGetBigger => {
    const {
      props: { nodeModel, update }
    } = this;
    const maxAllowed = 1000;
    const resizeAmount = 0.1; // +/- by 10% at a time
    // plus/minus buttons resize the image by a fixed amount
    const originalWidth = nodeModel.getIn(['meta', 'width']);
    const currentResizeWidth = nodeModel.getIn(
      ['meta', 'resizeWidth'],
      originalWidth
    );
    const originalHeight = nodeModel.getIn(['meta', 'height']);
    const currentResizeHeight = nodeModel.getIn(
      ['meta', 'resizeHeight'],
      originalHeight
    );
    const resizeAmountWidth = resizeAmount * originalWidth;
    const resizeAmountHeight = resizeAmount * originalHeight;
    // no-op because image is already biggest/smallest allowed?
    if (
      // user clicked plus but image is already max size
      (shouldGetBigger &&
        (currentResizeHeight + resizeAmountHeight > maxAllowed ||
          currentResizeWidth + resizeAmountWidth > maxAllowed)) ||
      // user clicked minus but image is already min size
      (!shouldGetBigger &&
        (currentResizeHeight - resizeAmountHeight < resizeAmountHeight ||
          currentResizeWidth - resizeAmountWidth < resizeAmountWidth))
    ) {
      return;
    }

    const updatedNodeModel = nodeModel
      .setIn(
        ['meta', 'resizeWidth'],
        shouldGetBigger
          ? currentResizeWidth + resizeAmountWidth
          : currentResizeWidth - resizeAmountWidth
      )
      .setIn(
        ['meta', 'resizeHeight'],
        shouldGetBigger
          ? currentResizeHeight + resizeAmountHeight
          : currentResizeHeight - resizeAmountHeight
      );
    update?.(updatedNodeModel);
  };

  updateCaption = evt => {
    const {
      props: { nodeModel, update }
    } = this;
    update?.(nodeModel.setIn(['meta', 'caption'], evt.target.value));
  };

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
      props: { offsetTop, offsetLeft, nodeModel, shouldHideCaption },
      state: { currentIdx }
    } = this;

    return (
      <EditImageMenu
        data-is-menu
        top={offsetTop}
        left={offsetLeft}
        shouldHideCaption={shouldHideCaption}
      >
        {this.menuItems.map(({ Component, onClick }, idx) => (
          <MenuItem
            key={Component.displayName}
            Styled={Component}
            onClick={onClick}
            isSelected={currentIdx === idx}
          />
        ))}
        {!shouldHideCaption && (
          <ImageCaptionInput
            id="image-caption-input"
            ref={this.captionRef}
            placeholder="Enter Image Caption here..."
            onChange={this.updateCaption}
            value={nodeModel.getIn(['meta', 'caption'], '')}
          />
        )}
        <PointClip>
          <Arrow />
        </PointClip>
        <HiddenFileInput
          name="hidden-image-upload-file-input"
          type="file"
          onChange={e => {
            this.replaceImageFile(e.target.files);
          }}
          accept="image/*"
          ref={this.fileInputRef}
        />
      </EditImageMenu>
    );
  }
}
