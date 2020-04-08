import React from 'react';
import styled from 'styled-components';
import FormattedSelections from './formatted-selections';

const PStyled = styled.p`
  position: relative;
  margin-bottom: 32px;
  word-break: break-word;
`;

export default React.memo(({ node }) => {
  console.debug('P RENDER', node);
  return (
    <PStyled data-type={node.get('type')} name={node.get('id')}>
      <FormattedSelections node={node} />
    </PStyled>
  );
});
