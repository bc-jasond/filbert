import * as React from 'react';
import styled from 'styled-components';

import {
  SvgIconMixin,
  LilBlackMenu,
  IconButton,
  ButtonSeparator,
  PointClip,
  Arrow, DarkInput,
} from '../../../common/components/shared-styled-components';
import IconTrashSvg from '../../../../assets/icons/trash.svg';

const IconTrash = styled(IconTrashSvg)`
  height: 32px;
  ${SvgIconMixin};
`;

const EditImageMenu = styled(LilBlackMenu)`
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
                  sectionDelete,
                  forwardRef,
                }) => (
  <EditImageMenu data-is-menu={true} top={offsetTop}>
    <Row>
      <IconButton onClick={() => sectionDelete(nodeModel.get('id'))}>
        <IconTrash />
      </IconButton>
      <ButtonSeparator />
      <QuoteInput
        ref={forwardRef}
        placeholder="Enter Quote here..."
        onChange={(e) => updateMeta(e.target.value, 'quote')}
        value={nodeModel.getIn(['meta', 'quote'], '')}
      />
    </Row>
    <Row>
      <UrlInput
        placeholder="Enter Url here..."
        onChange={(e) => updateMeta(e.target.value, 'url')}
        value={nodeModel.getIn(['meta', 'url'], '')}
      />
    </Row>
    <Row>
      <AuthorInput
        placeholder="Enter Author here..."
        onChange={(e) => updateMeta(e.target.value, 'author')}
        value={nodeModel.getIn(['meta', 'author'], '')}
      />
    </Row>
    <Row>
      <ContextInput
        placeholder="Enter Context here..."
        onChange={(e) => updateMeta(e.target.value, 'context')}
        value={nodeModel.getIn(['meta', 'context'], '')}
      />
    </Row>
    <PointClip>
      <Arrow />
    </PointClip>
  </EditImageMenu>
)