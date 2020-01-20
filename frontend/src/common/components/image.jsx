import { Map } from 'immutable';
import React from 'react';
import styled from 'styled-components';
import { NODE_TYPE_IMAGE } from '../constants';
import { ease } from '../css';
import { imageUrlIsId } from '../utils';
import {
  ContentSection,
  editSectionBorderMixin,
  miniText
} from './shared-styled-components';

export const ImageSection = styled(ContentSection)`
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto 52px;
`;
export const Figure = styled.figure`
  padding: 5px 0;
  position: relative;
  ${p =>
    Number.isInteger(p.heightOverride) &&
    `
    height: ${p.heightOverride}px;
  `}
`;
export const FigureCaption = styled.figcaption`
  ${miniText};
  text-align: center;
  margin-top: 5px;
`;
export const ImagePlaceholderContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
  ${p => `
    max-width: ${p.w}px;
    max-height: ${p.h}px;
  `}
`;
export const ImagePlaceholderFill = styled.div`
  ${p => `padding-bottom: ${(p.h / p.w) * 100}%;`}
`;
export const Img = styled.img`
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
  ${editSectionBorderMixin};
  ${p =>
    p.rotationDegrees === 90 &&
    `
    transform-origin: left;
    transform: translate(50%, -50%) rotate(90deg) ;
  `}
  ${p =>
    p.rotationDegrees === 180 &&
    `
    transform: scale(1,-1) ;
  `}
  ${p =>
    p.rotationDegrees === 270 &&
    `
    transform-origin: right;
    transform: translate(-50%, -50%) rotate(-90deg) ;
  `}
`;

export default class Image extends React.PureComponent {
  render() {
    console.debug('Image RENDER', this);
    const {
      props: { node, isEditing, setEditNodeId }
    } = this;
    const id = node.get('id');
    const meta = node.get('meta', Map());
    const w = meta.get('width');
    const h = meta.get('height');
    const urlField = meta.get('url') || '';
    // construct our url from the hash OR assume 3rd party URL
    const url = imageUrlIsId(urlField)
      ? `${process.env.API_URL}/image/${urlField}`
      : urlField;
    const rotationDegrees = meta.get('rotationDegrees', 0);
    let heightOverride;
    // if the image is rotated left once or right once change the height of the image container
    // to the width of the image to cover the increased/decreased dimension after CSS transform
    if (rotationDegrees === 90 || rotationDegrees === 270) {
      // current max-width of an ImageSection is 1000px...
      heightOverride = Math.min(w, 1000);
    }
    return (
      <ImageSection data-type={NODE_TYPE_IMAGE} name={id}>
        <Figure heightOverride={heightOverride}>
          <ImagePlaceholderContainer w={w} h={h}>
            <ImagePlaceholderFill w={w} h={h} />
            {urlField.length > 0 && (
              <Img
                isEditMode={setEditNodeId}
                isEditing={isEditing}
                onClick={() => setEditNodeId && setEditNodeId(id)}
                rotationDegrees={rotationDegrees}
                src={url}
              />
            )}
          </ImagePlaceholderContainer>
        </Figure>
        <FigureCaption>{meta.get('caption')}</FigureCaption>
      </ImageSection>
    );
  }
}
