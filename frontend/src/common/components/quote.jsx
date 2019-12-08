import React from 'react';
import { NODE_TYPE_QUOTE } from '../constants';
import {
  A,
  ContentSection,
  Img,
  ItalicText,
  MiniText,
  QuoteP
} from './shared-styled-components';

export default class Quote extends React.PureComponent {
  render() {
    console.debug('Quote RENDER', this);
    const { node, isEditing, setEditNodeId } = this.props;
    const id = node.get('id');
    const quote = node.getIn(['meta', 'quote'], '');
    const url = node.getIn(['meta', 'url'], '');
    const author = node.getIn(['meta', 'author'], '');
    const context = node.getIn(['meta', 'context'], '');
    return (
      <ContentSection data-type={NODE_TYPE_QUOTE} name={id}>
        <QuoteP
          isEditMode={setEditNodeId}
          isEditing={isEditing}
          onClick={() => setEditNodeId && setEditNodeId(id)}
        >
          {'💡Remember: '}
          <ItalicText>
            {quote && `"${quote}" `}
            <A target="_blank" href={url}>
              {author && `-${author}`}
            </A>
            <MiniText>{context && ` ${context}`}</MiniText>
          </ItalicText>
        </QuoteP>
      </ContentSection>
    );
  }
}
