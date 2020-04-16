import React from 'react';
import styled from 'styled-components';
import { NODE_TYPE_SPACER } from '../constants';
import { ContentSectionStyled } from './shared-styled-components';
import { editSectionBorderMixin } from './shared-styled-components-mixins';

const SpacerSection = styled(ContentSectionStyled)`
  &::after {
    content: '✎﹏﹏﹏﹏﹏﹏﹏﹏﹏';
    text-align: center;
    display: block;
    margin: 0 auto;
    width: 266px;
  }
  ${editSectionBorderMixin};
`;

export default React.memo(({ node, isEditing, setEditNodeId }) => {
  console.debug('Spacer RENDER', node);
  const id = node.get('id');
  return (
    <SpacerSection
      data-type={NODE_TYPE_SPACER}
      name={id}
      isEditMode={setEditNodeId}
      isEditing={isEditing}
      onClick={() => setEditNodeId?.(id)}
    />
  );
});
