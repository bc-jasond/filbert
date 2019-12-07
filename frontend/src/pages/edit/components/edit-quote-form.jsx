import * as React from 'react';
import styled from 'styled-components';

import {
  SvgIconMixin,
  LilSassyMenu,
  IconButton,
  ButtonSeparator,
  PointClip,
  Arrow, DarkInput,
} from '../../../common/components/shared-styled-components';
import IconTrashSvg from '../../../../assets/icons/trash.svg';
import { KEYCODE_ENTER, KEYCODE_ESC } from '../../../common/constants';

const IconTrash = styled(IconTrashSvg)`
  height: 32px;
  ${SvgIconMixin};
`;

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
                  sectionDelete,
                  forwardRef,
                  closeMenu,
                }) => {
  function handleKeyDown(e) {
    if ([KEYCODE_ESC, KEYCODE_ENTER].includes(e.keyCode)) {
      e.stopPropagation()
      e.preventDefault()
      closeMenu();
    }
  }
  return (
    <EditQuoteMenu data-is-menu={true} top={offsetTop}>
      <Row>
        <IconButton onClick={() => sectionDelete(nodeModel.get('id'))}>
          <IconTrash />
        </IconButton>
        <ButtonSeparator />
        <QuoteInput
          ref={forwardRef}
          placeholder="Enter Quote here..."
          onChange={(e) => updateMeta( 'quote', e.target.value)}
          value={nodeModel.getIn(['meta', 'quote'], '')}
          onKeyDown={handleKeyDown}
        />
      </Row>
      <Row>
        <UrlInput
          placeholder="Enter Url here..."
          onChange={(e) => updateMeta('url', e.target.value)}
          value={nodeModel.getIn(['meta', 'url'], '')}
          onKeyDown={handleKeyDown}
        />
      </Row>
      <Row>
        <AuthorInput
          placeholder="Enter Author here..."
          onChange={(e) => updateMeta('author', e.target.value)}
          value={nodeModel.getIn(['meta', 'author'], '')}
          onKeyDown={handleKeyDown}
        />
      </Row>
      <Row>
        <ContextInput
          placeholder="Enter Context here..."
          onChange={(e) => updateMeta('context', e.target.value)}
          value={nodeModel.getIn(['meta', 'context'], '')}
          onKeyDown={handleKeyDown}
        />
      </Row>
      <PointClip>
        <Arrow />
      </PointClip>
    </EditQuoteMenu>
  )
}