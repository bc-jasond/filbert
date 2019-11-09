import * as React from 'react';
import styled from 'styled-components';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_SITEINFO,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_LINK,
  SELECTION_LINK_URL,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
  NODE_TYPE_SECTION_H1,
  NODE_TYPE_SECTION_H2,
} from '../../common/constants';
import {
  SvgIconMixin,
  LilBlackMenu,
  IconButton,
  DarkInput,
  ButtonSeparator,
  PointClip,
  Arrow,
} from '../../common/shared-styled-components';

import IconBoldSvg from '../../../assets/icons/bold.svg';
import IconItalicSvg from '../../../assets/icons/italic.svg';
import IconCodeSvg from '../../../assets/icons/code.svg';
import IconInfoSvg from '../../../assets/icons/info.svg';
import IconStrikethroughSvg from '../../../assets/icons/strikethrough.svg';
import IconLinkSvg from '../../../assets/icons/link.svg';
import IconH1Svg from '../../../assets/icons/h1.svg';
import IconH2Svg from '../../../assets/icons/h2.svg';

const IconBold = styled(IconBoldSvg)`
  ${SvgIconMixin};
`;
const IconItalic = styled(IconItalicSvg)`
  ${SvgIconMixin};
`;
const IconCode = styled(IconCodeSvg)`
  ${SvgIconMixin};
`;
const IconSiteinfo = styled(IconInfoSvg)`
  ${SvgIconMixin};
`;
const IconStrikethrough = styled(IconStrikethroughSvg)`
  ${SvgIconMixin};
`;
const IconLink = styled(IconLinkSvg)`
  ${SvgIconMixin};
`;
const IconH1 = styled(IconH1Svg)`
  ${SvgIconMixin};
`;
const IconH2 = styled(IconH2Svg)`
  ${SvgIconMixin};
`;

export const FormatSelectionMenu = styled(LilBlackMenu)`
  top: ${p => p.top - (p.shouldShowUrl ? 30 : 0)}px;
  left: ${p => p.left - 165}px; // 165 is half the width of the menu
`;
export const LinkInput = styled(DarkInput)`
  display: block;
  height: 0;
  transition: .05s height;
  ${p => p.selected && `
    padding: 12px;
    padding-top: 0;
    height: 30px;
  `}
`;

export default ({
                  offsetTop,
                  offsetLeft,
                  nodeModel,
                  selectionModel,
                  selectionAction,
                  updateLinkUrl,
                  forwardRef,
                }) => (
  <FormatSelectionMenu shouldShowUrl={selectionModel.get(SELECTION_ACTION_LINK)} top={offsetTop} left={offsetLeft}>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_BOLD)}>
      <IconBold selected={selectionModel.get(SELECTION_ACTION_BOLD)} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_ITALIC)}>
      <IconItalic selected={selectionModel.get(SELECTION_ACTION_ITALIC)} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_CODE)}>
      <IconCode selected={selectionModel.get(SELECTION_ACTION_CODE)} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_SITEINFO)}>
      <IconSiteinfo selected={selectionModel.get(SELECTION_ACTION_SITEINFO)} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_STRIKETHROUGH)}>
      <IconStrikethrough selected={selectionModel.get(SELECTION_ACTION_STRIKETHROUGH)} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_LINK)}>
      <IconLink selected={selectionModel.get(SELECTION_ACTION_LINK)} />
    </IconButton>
    <ButtonSeparator />
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_H1)}>
      <IconH1 selected={nodeModel.get('type') === NODE_TYPE_SECTION_H1} />
    </IconButton>
    <IconButton onClick={() => selectionAction(SELECTION_ACTION_H2)}>
      <IconH2 selected={nodeModel.get('type') === NODE_TYPE_SECTION_H2} />
    </IconButton>
    <LinkInput
      ref={forwardRef}
      placeholder="Enter URL here..."
      selected={selectionModel.get(SELECTION_ACTION_LINK)}
      onChange={(e) => updateLinkUrl(e.target.value)}
      value={selectionModel.get(SELECTION_LINK_URL)}
    />
    <PointClip>
      <Arrow />
    </PointClip>
  </FormatSelectionMenu>
)