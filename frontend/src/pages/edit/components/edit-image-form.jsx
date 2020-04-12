import { Map } from 'immutable';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import {
  Arrow,
  Cursor,
  DarkInput,
  IconButton,
  LilSassyMenu,
  PointClip,
} from '../../../common/components/shared-styled-components';
import IconImageSvg from '../../../../assets/icons/image.svg';
import IconRotateSvg from '../../../../assets/icons/rotate.svg';
import PlusPxSvg from '../../../../assets/icons/plus-px.svg';
import MinusPxSvg from '../../../../assets/icons/minus-px.svg';
import { svgIconMixin } from '../../../common/components/shared-styled-components-mixins';
import {
  KEYCODE_LEFT_ARROW,
  KEYCODE_RIGHT_ARROW,
  KEYCODE_SPACE,
} from '../../../common/constants';
import { uploadImage } from '../../../common/fetch';
import { stopAndPrevent } from '../../../common/utils';
import {
  caretIsAtBeginningOfInput,
  caretIsAtEndOfInput,
  focusAndScrollSmooth,
  getImageFileFormData,
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
  top: ${(p) => p.top + 10}px;
  width: ${(p) => (p.shouldHideCaption ? '162px' : '500px')};
  margin: 0 auto;
  left: ${(p) => (p.left ? `${p.left}px` : '50%')};
  margin-left: ${(p) => (p.shouldHideCaption ? '-81px' : '-250px')};
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

export default React.memo(
  ({
    offsetTop,
    offsetLeft,
    nodeModel,
    shouldHideCaption,
    update,
    post,
    windowEvent,
  }) => {
    const captionInputIdx = 4;
    const nodeId = nodeModel.get('id');

    const captionRef = useRef(null);
    const fileInputRef = useRef(null);
    const [currentIdx, setCurrentIdx] = useState(captionInputIdx);
    const [shouldFocusEnd, setShouldFocusEnd] = useState(null);

    useEffect(() => {
      if (currentIdx === captionInputIdx) {
        focusAndScrollSmooth(nodeId, captionRef?.current, shouldFocusEnd);
        return;
      }
      captionRef?.current?.blur?.();
    }, [currentIdx, shouldFocusEnd, nodeId, captionInputIdx]);

    async function replaceImageFile([firstFile]) {
      if (!firstFile) {
        // TODO: user hit cancel in the file dialog?
        return;
      }
      // TODO: add a loading indicator while uploading
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
    }

    function imageRotate() {
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
    }

    function imageResize(shouldGetBigger) {
      const maxSizeAllowedInPixels = 1000;
      const resizeAmountPercentage = 0.1; // +/- by 10% at a time
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
      const resizeAmountWidth = resizeAmountPercentage * originalWidth;
      const resizeAmountHeight = resizeAmountPercentage * originalHeight;
      // no-op because image is already biggest/smallest allowed?
      if (
        // user clicked plus but image is already max size
        (shouldGetBigger &&
          (currentResizeHeight + resizeAmountHeight > maxSizeAllowedInPixels ||
            currentResizeWidth + resizeAmountWidth > maxSizeAllowedInPixels)) ||
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
    }

    function updateCaption({ target: { value } }) {
      update?.(nodeModel.setIn(['meta', 'caption'], value));
    }

    const menuItems = [
      {
        Component: IconImage,
        onClick: () => fileInputRef?.current?.click?.(),
      },
      {
        Component: IconRotate,
        onClick: () => imageRotate(),
      },
      { Component: PlusPx, onClick: () => imageResize(true) },
      { Component: MinusPx, onClick: () => imageResize(false) },
    ];

    useEffect(() => {
      function handleKeyDown(evt) {
        if (!evt || evt.defaultPrevented) {
          return;
        }
        if (
          evt.keyCode === KEYCODE_LEFT_ARROW &&
          (currentIdx < captionInputIdx || caretIsAtBeginningOfInput())
        ) {
          const nextIdx = currentIdx === 0 ? captionInputIdx : currentIdx - 1;
          setCurrentIdx(nextIdx);
          setShouldFocusEnd(true);
          stopAndPrevent(evt);
          return;
        }
        if (
          evt.keyCode === KEYCODE_RIGHT_ARROW &&
          (currentIdx < captionInputIdx || caretIsAtEndOfInput())
        ) {
          const nextIdx = currentIdx === captionInputIdx ? 0 : currentIdx + 1;
          setCurrentIdx(nextIdx);
          setShouldFocusEnd(false);
          stopAndPrevent(evt);
          return;
        }
        if (
          evt.keyCode === KEYCODE_SPACE &&
          currentIdx > -1 &&
          currentIdx < captionInputIdx
        ) {
          if (currentIdx > -1) {
            menuItems[currentIdx]?.onClick?.();
          }
          stopAndPrevent(evt);
        }
      }

      handleKeyDown(windowEvent);
    }, [windowEvent, currentIdx, menuItems]);

    return (
      <EditImageMenu
        id="edit-image-menu"
        data-is-menu
        top={offsetTop}
        left={offsetLeft}
        shouldHideCaption={shouldHideCaption}
      >
        {menuItems.map(({ Component, onClick }, idx) => (
          <MenuItem
            key={Component.displayName}
            Styled={Component}
            onClick={onClick}
            isSelected={currentIdx === idx}
          />
        ))}
        {!shouldHideCaption && (
          <ImageCaptionInput
            id="edit-image-menu-caption-input"
            ref={captionRef}
            placeholder="Enter Image Caption here..."
            onChange={updateCaption}
            value={nodeModel.getIn(['meta', 'caption'], '')}
          />
        )}
        <PointClip>
          <Arrow />
        </PointClip>
        <HiddenFileInput
          name="edit-image-hidden-file-input"
          type="file"
          onChange={(e) => {
            replaceImageFile(e.target.files);
          }}
          accept="image/*"
          ref={fileInputRef}
        />
      </EditImageMenu>
    );
  }
);
