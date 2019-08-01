import * as React from 'react';
import styled, { css } from 'styled-components';
import { blue, darkBlue, darkGrey } from '../../common/css';
import {
  SELECTION_ACTION_BOLD,
  SELECTION_ACTION_ITALIC,
  SELECTION_ACTION_CODE,
  SELECTION_ACTION_STRIKETHROUGH,
  SELECTION_ACTION_LINK,
  SELECTION_ACTION_H1,
  SELECTION_ACTION_H2,
} from '../../common/constants';

import IconBoldSvg from '../../../assets/bold.svg';
import IconItalicSvg from '../../../assets/italic.svg';
import IconCodeSvg from '../../../assets/code.svg';
import IconStrikethroughSvg from '../../../assets/strikethrough.svg';
import IconLinkSvg from '../../../assets/link.svg';
import IconH1Svg from '../../../assets/h1.svg';
import IconH2Svg from '../../../assets/h2.svg';

const SvgIconMixin = css`
  fill: #fff;
  position: relative;
  top: -1px;
  vertical-align: middle;
  height: 21px;
  &:hover {
    fill: ${blue};
  }
  ${p => p.selected && `
    fill: ${darkBlue};
  `}
`;
const IconBold = styled(IconBoldSvg)`
  ${SvgIconMixin};
`;
const IconItalic = styled(IconItalicSvg)`
  ${SvgIconMixin};
`;
const IconCode = styled(IconCodeSvg)`
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

export const FormatSelectionMenu = styled.div`
  position: absolute;
  top: ${p => p.top - 50}px;
  left: ${p => p.left - 146}px; // 146 is half the width of the menu
  z-index: 11;
  background-image: linear-gradient(to bottom,rgba(49,49,47,.99),#262625);
  background-repeat: repeat-x;
  border-radius: 5px;
  padding: 0 10px;
  color: ${darkGrey};
`;
export const FormatButton = styled.button`
  position: relative;
  background: rgba(0,0,0,0);
  color: white;
  font-size: 16px;
  transition: .1s background-color,.1s border-color,.1s color,.1s fill;
  border: 0;
  display: inline-block;
  vertical-align: middle;
  height: 44px;
  line-height: 21px;
  margin: 0 8px;
  padding: 0;
  cursor: pointer;
  user-select: none;
  outline: 0;
`;
export const ButtonSeparator = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 1px;
  margin: 0 6px;
  height: 24px;
  background: rgba(255,255,255,.2);
`;
export const PointClip = styled.div`
  position: absolute;
  bottom: -10px;
  left: 50%;
  clip: rect(10px 20px 20px 0);
  margin-left: -10px;
`;
export const Arrow = styled.span`
  display: block;
  width: 20px;
  height: 20px;
  background-color: #262625;
  transform: rotate(45deg) scale(.5);
`;

export default ({
                  offsetTop,
                  offsetLeft,
                  isBold,
                  isItalic,
                  isCode,
                  isStrikethrough,
                  isLink,
                  isH1,
                  isH2,
                  selectionAction,
                }) => (
  <FormatSelectionMenu top={offsetTop} left={offsetLeft}>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_BOLD)}>
      <IconBold selected={isBold} />
    </FormatButton>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_ITALIC)}>
      <IconItalic selected={isItalic} />
    </FormatButton>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_CODE)}>
      <IconCode selected={isCode} />
    </FormatButton>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_STRIKETHROUGH)}>
      <IconStrikethrough selected={isStrikethrough} />
    </FormatButton>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_LINK)}>
      <IconLink selected={isLink} />
    </FormatButton>
    <ButtonSeparator />
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_H1)}>
      <IconH1 selected={isH1} />
    </FormatButton>
    <FormatButton onClick={() => selectionAction(SELECTION_ACTION_H2)}>
      <IconH2 selected={isH2} />
    </FormatButton>
    <PointClip>
      <Arrow />
    </PointClip>
  </FormatSelectionMenu>
)