import React from 'react';
import styled from 'styled-components';
import FormattedSelections from './formatted-selections';

const LiStyled = styled.li`
  margin-left: 30px;
  margin-bottom: 14px;
  &::before {
    box-sizing: border-box;
    padding-right: 12px;
    counter-increment: post;
    content: counter(post) '.';
    position: absolute;
    display: inline-block;
    width: 78px;
    margin-left: -78px;
    text-align: right;
  }
`;

export default React.memo(({ node }) => {
  console.debug('Li RENDER', node);
  return (
    <LiStyled data-type={node.get('type')} name={node.get('id')}>
      <FormattedSelections node={node} />
    </LiStyled>
  );
});
