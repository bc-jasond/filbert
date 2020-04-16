import React from 'react';
import styled from 'styled-components';
import { NODE_TYPE_QUOTE } from '../constants';
import {
  A,
  ContentSectionStyled,
  ItalicText,
  MiniText,
} from './shared-styled-components';
import { editSectionBorderMixin } from './shared-styled-components-mixins';

const QuoteP = styled.p`
  position: relative;
  margin-bottom: 32px;
  word-break: break-word;
  ${editSectionBorderMixin};
`;

export default React.memo(({ node, isEditing, setEditNodeId }) => {
  console.debug('Quote RENDER', node);

  const id = node.get('id');
  const quote = node.getIn(['meta', 'quote'], '');
  const url = node.getIn(['meta', 'url'], '');
  const author = node.getIn(['meta', 'author'], '');
  const context = node.getIn(['meta', 'context'], '');
  return (
    <ContentSectionStyled data-type={NODE_TYPE_QUOTE} name={id}>
      <QuoteP
        isEditMode={setEditNodeId}
        isEditing={isEditing}
        onClick={() => setEditNodeId && setEditNodeId(id)}
      >
        {'💡 '}
        <ItalicText>
          {quote && `"${quote}" `}
          <A target="_blank" href={url}>
            {author && `-${author}`}
          </A>
          <MiniText>{context && ` ${context}`}</MiniText>
        </ItalicText>
      </QuoteP>
    </ContentSectionStyled>
  );
});
