import { Map } from 'immutable';
import React from 'react';
import { NODE_TYPE_IMAGE } from '../constants';
import { imageUrlIsId } from '../utils';
import {
  Figure,
  FigureCaption,
  ImagePlaceholderContainer,
  ImagePlaceholderFill, ImageSection,
  Img
} from './shared-styled-components';

export default class Image extends React.PureComponent {
  render() {
    console.debug("Image RENDER", this);
    const {
      node,
      currentEditNode,
      setEditNodeId,
    } = this.props;
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
      <ImageSection data-type={NODE_TYPE_IMAGE} name={id} contentEditable={false}>
        <Figure heightOverride={heightOverride}>
          <ImagePlaceholderContainer w={w} h={h}>
            <ImagePlaceholderFill w={w} h={h} />
            {urlField.length > 0 && (<Img
              isEditMode={setEditNodeId}
              isEditing={currentEditNode && currentEditNode.get('id') === id}
              onClick={() => setEditNodeId && setEditNodeId(id)}
              rotationDegrees={rotationDegrees}
              src={url}
            />)}
          </ImagePlaceholderContainer>
        </Figure>
        <FigureCaption>{meta.get('caption')}</FigureCaption>
      </ImageSection>
    )
  }
}
