import * as React from 'react';
import styled from 'styled-components';

import {
  LilSassyMenu,
  PointClip,
  Arrow, DarkInput,
} from '../../../common/components/shared-styled-components';

const EditQuoteMenu = styled(LilSassyMenu)`
  display: flex;
  flex-direction: column;
  justify-items: center;
  top: ${p => p.top - 90}px;
  width: 400px;
  margin: 0 auto;
  padding: 8px;
  left:50%;
  margin-left:-200px;
`;
const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 32px;
`;
const QuoteInput = styled(DarkInput)`
  margin: 0 8px;
`;
const UrlInput = styled(DarkInput)`
margin: 0 8px;
`;
const AuthorInput = styled(DarkInput)`
margin: 0 8px;
`;
const ContextInput = styled(DarkInput)`
margin: 0 8px;
`;

export default ({
                  offsetTop,
                  nodeModel,
                  updateMeta,
                  forwardRef,
                }) => (
  <EditQuoteMenu data-is-menu={true} top={offsetTop}>
    <Row>
      <QuoteInput
        ref={forwardRef}
        placeholder="Enter Quote here..."
        onChange={(e) => updateMeta('quote', e.target.value)}
        value={nodeModel.getIn(['meta', 'quote'], '')}
      />
    </Row>
    <Row>
      <UrlInput
        placeholder="Enter Url here..."
        onChange={(e) => updateMeta('url', e.target.value)}
        value={nodeModel.getIn(['meta', 'url'], '')}
      />
    </Row>
    <Row>
      <AuthorInput
        placeholder="Enter Author here..."
        onChange={(e) => updateMeta('author', e.target.value)}
        value={nodeModel.getIn(['meta', 'author'], '')}
      />
    </Row>
    <Row>
      <ContextInput
        placeholder="Enter Context here..."
        onChange={(e) => updateMeta('context', e.target.value)}
        value={nodeModel.getIn(['meta', 'context'], '')}
      />
    </Row>
    <PointClip>
      <Arrow />
    </PointClip>
  </EditQuoteMenu>
)
