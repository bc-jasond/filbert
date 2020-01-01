import styled, { css } from 'styled-components';
import { Link } from 'react-router-dom';
import {
  contentSerif,
  italicSerif,
  monospaced,
  sansSerif,
  titleSerif
} from '../fonts.css';
import {
  blue,
  darkBlue,
  darkGrey,
  error,
  grey,
  lightBlue,
  lightGrey,
  mediumGrey,
  success
} from '../css';

const sectionWidthMixin = css`
  max-width: 740px;
  margin: 0 auto;
`;
const editSectionBorderMixin = css`
  border: 4px solid ${p => (p.isEditing ? blue : 'transparent')};
  ${p =>
    p.isEditMode &&
    `
    &:hover {
      cursor: pointer;
      border: 4px solid ${p.isEditing ? blue : lightBlue};
    }
  `}
`;
export const H1Styled = styled.h1`
  ${sectionWidthMixin}
  font-family: ${titleSerif}, serif;
  font-size: 46px;
  line-height: 1.25;
  margin-bottom: 24px;
  ${p =>
    p.shouldShowPlaceholder &&
    `
    &::before {
      content: 'Write a title and hit enter...';
      position: absolute;
      color: ${mediumGrey};
    }
  `}
`;
export const H2Styled = styled.h2`
  ${sectionWidthMixin}
  margin-top: 30px;
  margin-bottom: 8px;
  font-weight: 600;
  --x-height-multiplier: 0.342;
  --baseline-multiplier: 0.22;
  font-family: ${sansSerif}, sans-serif;
  letter-spacing: -0.02em;
  font-style: normal;
  font-size: 32px;
  line-height: 1.22;
  letter-spacing: -0.012em;
`;
export const H3Styled = styled.h3`
  ${sectionWidthMixin}
  text-overflow: ellipsis;
  //max-height: 56px;
  margin-bottom: 8px;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 28px;
  font-weight: 600;
  font-style: normal;
  font-family: ${sansSerif}, sans-serif;
`;
export const ContentSection = styled.section`
  ${sectionWidthMixin}
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -.01em;
  margin-bottom: 52px;
`;
export const SpacerSection = styled(ContentSection)`
  &::after {
    content: '✎﹏﹏﹏﹏﹏﹏﹏﹏﹏';
    text-align: center;
    display: block;
    margin: 0 auto;
    width: 266px;
  }
  ${editSectionBorderMixin};
`;
export const ImageSection = styled(ContentSection)`
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto 52px;
`;
export const PStyled = styled.p`
  position: relative;
  margin-bottom: 32px;
`;
export const QuoteP = styled(PStyled)`
  ${editSectionBorderMixin};
`;
export const PreStyled = styled.pre`
  font: inherit;
  margin: 0;
  &::before {
    display: inline-block;
    width: 35px;
    color: ${mediumGrey};
    counter-increment: code;
    content: counter(code);
  }
`;
export const CodeSection = styled(ContentSection)`
  font-family: ${monospaced}, monospace;
  font-size: 16px;
  max-height: 350px;
  letter-spacing: -0.03em;
  word-spacing: -0.2em;
  line-height: 1.75;
  background: ${lightGrey};
  padding: 20px;
  overflow: auto;
  counter-reset: code;
`;
export const Ol = styled.ol`
  margin-bottom: 38px;
  counter-reset: post;
  padding: 0;
  list-style: none;
  list-style-image: none;
  word-break: break-word;
  word-wrap: break-word;
  visibility: visible;
`;
export const LiStyled = styled.li`
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
const linkMixin = css`
  cursor: pointer;
  font: inherit;
  text-decoration: none;
  background-repeat: repeat-x;
  background-image: linear-gradient(
    to right,
    ${darkGrey} 100%,
    rgba(0, 0, 0, 0) 0
  );
  background-image: linear-gradient(
    to right,
    currentColor 100%,
    currentColor 0
  );
  background-size: 1px 1px;
  background-position: 0 1.05em;
  background-position: 0 calc(1em + 1px);
`;
export const A = styled.a`
  ${linkMixin}
`;
export const LinkStyled = styled(Link)`
  ${linkMixin}
`;
export const Code = styled.code`
  font-family: ${monospaced}, monospace;
  font-size: 18px;
  background: ${lightGrey};
  padding: 4px;
  margin: 0 2px;
`;
export const SiteInfo = styled.span`
  font-family: ${sansSerif}, sans-serif;
`;
export const ItalicText = styled.em`
  font-family: ${italicSerif}, sans-serif;
`;
export const StrikeText = styled.span`
  text-decoration: line-through;
  font-family: inherit;
`;
export const BoldText = styled.strong`
  font-weight: 700;
`;
const miniText = css`
  font-family: ${sansSerif}, sans-serif;
  font-weight: 300;
  font-style: normal;
  font-size: 16px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.68);
  letter-spacing: 0;
`;
export const MiniText = styled.span`
  ${miniText}
`;
export const Figure = styled.figure`
  padding: 5px 0;
  position: relative;
  ${p =>
    Number.isInteger(p.heightOverride) &&
    `
    height: ${p.heightOverride}px;
  `}
`;
export const FigureCaption = styled.figcaption`
  ${miniText}
  text-align: center;
  margin-top: 5px;
`;
export const ImagePlaceholderContainer = styled.div`
  position: relative;
  width: 100%;
  margin: 0 auto;
  ${p => `
    max-width: ${p.w}px;
    max-height: ${p.h}px;
  `}
`;
export const ImagePlaceholderFill = styled.div`
  ${p => `padding-bottom: ${(p.h / p.w) * 100}%;`}
`;
export const Img = styled.img`
  position: absolute;
  box-sizing: border-box;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  display: block;
  max-width: 100%;
  ${editSectionBorderMixin};
  ${p =>
    p.rotationDegrees === 90 &&
    `
    transform-origin: left;
    transform: translate(50%, -50%) rotate(90deg) ;
  `}
  ${p =>
    p.rotationDegrees === 180 &&
    `
    transform: scale(1,-1) ;
  `}
  ${p =>
    p.rotationDegrees === 270 &&
    `
    transform-origin: right;
    transform: translate(-50%, -50%) rotate(-90deg) ;
  `}
`;

// FORMS
export const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 24px 0;
  &:last-of-type {
    margin-bottom: 48px;
  }
`;
export const Input = styled.input`
  font-size: 18px;
  font-weight: 400;
  font-family: ${monospaced};
  line-height: 36px;
  border-radius: 2px;
  border: 1px solid ${grey};
  padding: 2px 8px;
  ${p =>
    p.error &&
    css`
      border-color: ${error};
    `}
`;
export const TextArea = styled.textarea`
  font-size: 18px;
  font-weight: 400;
  font-family: ${monospaced};
  line-height: 36px;
  border-radius: 2px;
  border: 1px solid ${grey};
  padding: 2px 8px;
  min-height: 200px;
  ${p =>
    p.error &&
    css`
      border-color: ${error};
    `}
`;
export const Label = styled.label`
  margin-bottom: 4px;
  font-family: ${sansSerif};
  ${p =>
    p.error &&
    css`
      color: ${error};
    `}
`;
export const SuccessMessage = styled.span`
  font-family: inherit;
  color: ${success};
`;
export const ErrorMessage = styled.span`
  font-family: inherit;
  color: ${error};
`;
export const MessageContainer = styled.div`
  min-height: 36px;
  margin-bottom: 8px;
  text-align: center;
  font-family: ${monospaced};
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const Button = styled.button`
  display: block;
  border-radius: 26px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
  width: 100%;
  margin-bottom: 16px;
  background: ${blue};
  padding: 14px 18px;
  font-size: 18px;
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-appearance: none;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);

  &:hover {
    background: ${darkBlue};
  }
  ${p =>
    p.disabled &&
    css`
      background: ${mediumGrey};
      &:hover {
        background: ${mediumGrey};
      }
    `}
`;
export const CancelButton = styled(Button)`
  background: ${mediumGrey};
  &:hover {
    background: ${grey};
  }
`;
export const ButtonSpan = styled.span`
  color: white;
  font-family: ${sansSerif};
`;
export const NavButtonMixin = css`
  font-family: ${monospaced}, monospaced;
  color: ${grey};
  cursor: pointer;
  text-decoration: none;
  font-size: 18px;
  line-height: 24px;
  padding: 14px 18px;
  border-radius: 26px;
  border: 1px solid transparent;
  transition: background-color 0.125s, color 0.125s;
  flex-grow: 0;
  &:hover {
    color: white;
    background-color: ${lightBlue};
  }
  ${p =>
    p.isOpen &&
    `
    color: white;
    background-color: ${lightBlue};
  `}
`;

// LIL SASSY FORMS with ICONS
export const LilSassyMenu = styled.div`
  position: absolute;
  transition: 0.1s top;
  top: ${p => p.top}px;
  z-index: 13;
  background-image: linear-gradient(to bottom, rgba(49, 49, 47, 0.99), #262625);
  background-repeat: repeat-x;
  border-radius: 5px;
  padding: 0 10px;
  color: ${darkGrey};
`;
export const SvgIconMixin = css`
  fill: #fff;
  position: relative;
  top: -1px;
  vertical-align: middle;
  height: 21px;
  &:hover {
    fill: ${blue};
  }
  ${p =>
    p.selected &&
    `
    fill: ${blue};
  `}
  ${p =>
    p.checked &&
    `
    fill: ${darkBlue};
  `}
`;
export const IconButton = styled.button`
  position: relative;
  background: rgba(0, 0, 0, 0);
  color: white;
  font-size: 16px;
  transition: 0.1s background-color, 0.1s border-color, 0.1s color, 0.1s fill;
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
export const DarkInput = styled.input`
  //flex: 1;
  background: rgba(0, 0, 0, 0);
  color: #fff;
  border: none;
  outline: 0;
  font-size: 16px;
  border-radius: 5px;
  //appearance: none;
`;
export const ButtonSeparator = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 1px;
  margin: 0 6px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
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
  transform: rotate(45deg) scale(0.5);
`;
export const ProfileImg = styled.img`
  flex-shrink: 0;
  border-radius: 50%;
  margin: 8px;
  position: relative;
  height: 72px;
  width: 72px;
  z-index: 0;
`;
