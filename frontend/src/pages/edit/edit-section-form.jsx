import React from 'react';
import styled from 'styled-components';
import {
  Button,
  ButtonSpan,
  CancelButton,
  Input,
  InputContainer,
  Label,
} from '../../common/shared-styled-components';
import {
  NODE_TYPE_SECTION_QUOTE,
  NODE_TYPE_SECTION_IMAGE,
} from '../../common/constants';

const sectionFieldsByType = {
  [NODE_TYPE_SECTION_QUOTE]: ['quote', 'url', 'author', 'context'],
  [NODE_TYPE_SECTION_IMAGE]: ['width', 'height', 'url', 'caption'],
}

const EditSectionForm = styled.div`
  padding: 20px;
  background-color: white;
  position: absolute;
  width: 755px;
  top: ${p => p.topOffset}px;
  left: ${p => p.leftOffset}px;
`;

export default ({
                  editSectionId,
                  editSectionMeta,
                  editSectionType,
                  editSectionMetaFormTopOffset,
                  editSectionMetaFormLeftOffset,
                  updateMetaProp,
                  sectionSaveMeta,
                  close,
                }) => (
  <EditSectionForm
    topOffset={editSectionMetaFormTopOffset}
    leftOffset={editSectionMetaFormLeftOffset}
  >
    {sectionFieldsByType[editSectionType].map((type, idx) => (
      <InputContainer key={idx}>
        <Label htmlFor={type} error={false /*TODO*/}>{type}</Label>
        <Input name={type} type="text" value={editSectionMeta.get(type, '')}
               onChange={(e) => {
                 updateMetaProp(type, e.target.value)
               }}
               error={false /*TODO*/} />
      </InputContainer>
    ))}
    <Button onClick={() => {
      sectionSaveMeta(editSectionId)
    }}>
      <ButtonSpan>
        Save
      </ButtonSpan>
    </Button>
    <CancelButton onClick={close}>
      <ButtonSpan>Cancel</ButtonSpan>
    </CancelButton>
  </EditSectionForm>
)