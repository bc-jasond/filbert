import * as React from 'react';
import styled from 'styled-components';

import {
  Arrow,
  ButtonSeparator,
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

const fileInputRef = React.createRef();

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
export default ({
  offsetTop,
  nodeModel,
  uploadFile,
  updateMeta,
  imageRotate,
  forwardRef
}) => (
  <EditImageMenu data-is-menu top={offsetTop}>
    <IconButton onClick={() => fileInputRef.current.click()}>
      <IconImage />
    </IconButton>
    <IconButton onClick={() => imageRotate(nodeModel.getIn(['meta', 'url']))}>
      <IconRotate />
    </IconButton>
    <IconButton>
      <PlusPx />
    </IconButton>
    <IconButton>
      <MinusPx />
    </IconButton>
    <ImageCaptionInput
      ref={forwardRef}
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
      ref={fileInputRef}
    />
  </EditImageMenu>
);
