import * as React from 'react';
import styled, { css } from 'styled-components';
import { darkBlue, darkGrey, lightBlue } from '../../common/css';

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
  fill: ${darkBlue};
`;
const IconH1 = styled(IconH1Svg)`
  ${SvgIconMixin};
`;
const IconH2 = styled(IconH2Svg)`
  ${SvgIconMixin};
`;

export const FormatSelectionMenu = styled.div`
  position: absolute;
  z-index: 5;
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

export default ({offsetTop, offsetLeft}) => (
  <FormatSelectionMenu top={offsetTop} left={offsetLeft}>
    <FormatButton>
      <IconBold />
    </FormatButton>
    <FormatButton>
      <IconItalic />
    </FormatButton>
    <FormatButton>
      <IconCode />
    </FormatButton>
    <FormatButton>
      <IconStrikethrough />
    </FormatButton>
    <FormatButton>
      <IconLink />
    </FormatButton>
    <ButtonSeparator />
    <FormatButton>
      <IconH1 />
    </FormatButton>
    <FormatButton>
      <IconH2 />
    </FormatButton>
    <PointClip>
      <Arrow />
    </PointClip>
  </FormatSelectionMenu>
)