import React from 'react';
import styled from 'styled-components';
import {
  Button,
  ButtonSpan,
  CancelButton,
  DeleteButton,
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
  [NODE_TYPE_SECTION_IMAGE]: ['file', 'width', 'height', 'url', 'caption'],
}

const EditSectionForm = styled.div`
  z-index: 3;
  padding: 20px;
  background-color: white;
  position: absolute;
  width: 50%;
  left: 25%;
  top: ${p => p.topOffset}px;
`;

export default ({
                  editSectionId,
                  editSectionMeta,
                  editSectionType,
                  editSectionMetaFormTopOffset,
                  updateMetaProp,
                  sectionSaveMeta,
                  sectionDelete,
                  close,
                  forwardRef,
                }) => (
  <EditSectionForm
    topOffset={editSectionMetaFormTopOffset}
  >
    {sectionFieldsByType[editSectionType].map((type, idx) => (
      <InputContainer key={idx}>
        <Label htmlFor={type} error={false /*TODO*/}>{type}</Label>
        <Input name={type} type={type === 'file' ? 'file' : 'text'} value={editSectionMeta.get(type, '')}
               onChange={(e) => {
                 updateMetaProp(type, type === 'file' ? e.target.files : e.target.value)
               }}
               error={false /*TODO*/}
               ref={idx === 0 ? forwardRef : () => {}}/>
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
    <DeleteButton onClick={() => {
      sectionDelete(editSectionId);
    }}>
      <ButtonSpan>Delete</ButtonSpan>
    </DeleteButton>
  </EditSectionForm>
)