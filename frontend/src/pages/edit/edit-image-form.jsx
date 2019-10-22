import * as React from 'react';
import styled from 'styled-components';

import {
  SvgIconMixin,
  LilBlackMenu,
  IconButton,
  DarkInput,
  ButtonSeparator,
  PointClip,
  Arrow,
} from '../../common/shared-styled-components';
import IconImageSvg from '../../../assets/image.svg';
import IconTrashSvg from '../../../assets/trash.svg';

const fileInputRef = React.createRef();

const IconImage = styled(IconImageSvg)`
  ${SvgIconMixin};
`;
const IconTrash = styled(IconTrashSvg)`
  ${SvgIconMixin};
`;

const HiddenFileInput = styled.input`
  display: none;
`;
export const EditImageMenu = styled(LilBlackMenu)`
  display: flex;
  align-items: center;
  justify-items: center;
  top: ${p => p.top - 50}px;
  width: 400px;
  margin: 0 auto;
  left:50%;
  margin-left:-200px;
`;
export const ImageCaptionInput = styled(DarkInput)`
  margin: 0 8px;
`;
export default ({
                  offsetTop,
                  nodeModel,
                  uploadFile,
                  updateImageCaption,
                  sectionDelete,
                  forwardRef,
                }) => (
  <EditImageMenu data-is-menu={true} top={offsetTop}>
    <IconButton onClick={() => fileInputRef.current.click()}>
      <IconImage />
    </IconButton>
    <IconButton onClick={() => sectionDelete(nodeModel.get('id'))}>
      <IconTrash />
    </IconButton>
    <ButtonSeparator />
    <ImageCaptionInput
      ref={forwardRef}
      placeholder="Enter Image Caption here..."
      onChange={(e) => updateImageCaption(e.target.value)}
      value={nodeModel.getIn(['meta', 'caption'], '')}
    />
    <PointClip>
      <Arrow />
    </PointClip>
    <HiddenFileInput name="hidden-image-upload-file-input"
                     type="file"
                     onChange={(e) => {
                       uploadFile(e.target.files)
                     }}
                     accept="image/*"
                     ref={fileInputRef} />
  </EditImageMenu>
)