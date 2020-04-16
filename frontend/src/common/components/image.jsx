import { Map } from 'immutable';
import React from 'react';
import styled, { css } from 'styled-components';
import { NODE_TYPE_IMAGE } from '../constants';
import { ease } from '../css';
import { nodeIsValid } from '../utils';
import { ContentSectionStyled } from './shared-styled-components';
import {
  editSectionBorderMixin,
  miniTextMixin,
} from './shared-styled-components-mixins';

export const ImageSection = styled(ContentSectionStyled)`
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto 52px;
`;
export const Figure = styled.figure`
  position: relative;
  ${(p) =>
    p.heightOverride &&
    !Number.isNaN(p.heightOverride) &&
    css`
      height: ${p.heightOverride}px;
    `}
`;
export const FigureCaption = styled.figcaption`
  ${miniTextMixin};
  text-align: center;
  margin-top: 10px;
`;
export const ImagePlaceholderContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
  ${(p) => css`
    max-width: ${p.w}px;
    max-height: ${p.h}px;
  `};
`;
export const ImagePlaceholderFill = styled.div`
  ${(p) => `padding-bottom: ${(p.h / p.w) * 100}%;`}
`;
export const Img = styled.img`
  object-fit: cover;
  position: absolute;
  box-sizing: border-box;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: block;
  max-width: 100%;
  ${ease('transform')};
  ${(p) => !p.hideBorder && editSectionBorderMixin};
  ${(p) =>
    p.rotationDegrees === 90 &&
    css`
      transform-origin: left;
      transform: translate(50%, -50%) rotate(90deg);
    `}
  ${(p) =>
    p.rotationDegrees === 180 &&
    css`
      transform: scale(1, -1);
    `}
  ${(p) =>
    p.rotationDegrees === 270 &&
    css`
      transform-origin: right;
      transform: translate(-50%, -50%) rotate(-90deg);
    `}
`;

export default React.memo(
  ({ node, isEditing, setEditNodeId, hideBorder, hideCaption, className }) => {
    console.debug('Image RENDER', node);
    if (!nodeIsValid(node)) {
      return null;
    }
    const id = node.get('id');
    const meta = node.get('meta', Map());
    const w = meta.get('resizeWidth', meta.get('width'));
    const h = meta.get('resizeHeight', meta.get('height'));
    const url = meta.get('url');
    const rotationDegrees = meta.get('rotationDegrees', 0);
    let heightOverride;
    // if the image is rotated left once or right once change the height of the image container
    // to the width of the image to cover the increased/decreased dimension after CSS transform
    if (rotationDegrees === 90 || rotationDegrees === 270) {
      // current max-width of an ImageSection is 1000px...
      heightOverride = Math.min(w, 1000);
    }
    return (
      <ImageSection className={className} data-type={NODE_TYPE_IMAGE} name={id}>
        <Figure heightOverride={heightOverride}>
          <ImagePlaceholderContainer w={w} h={h}>
            <ImagePlaceholderFill w={w} h={h} />
            {url.length > 0 && (
              <Img
                isEditMode={setEditNodeId}
                isEditing={isEditing}
                hideBorder={hideBorder}
                onClick={() => setEditNodeId && setEditNodeId(id)}
                rotationDegrees={rotationDegrees}
                src={url}
              />
            )}
          </ImagePlaceholderContainer>
        </Figure>
        {!hideCaption && <FigureCaption>{meta.get('caption')}</FigureCaption>}
      </ImageSection>
    );
  }
);
