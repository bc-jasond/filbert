import { Link } from 'react-router-dom';
import styled, { css, keyframes } from 'styled-components';
import {
  accentColorPrimary,
  accentColorSecondary,
  altFontFamily,
  altFontSize,
  altFontWeight,
  altLetterSpacing,
  altLineHeight,
  backgroundColorSecondary,
  codeFontFamily,
  codeFontSize,
  codeFontWeight,
  codeLetterSpacing,
  codeLineHeight,
  darkGrey,
  error,
  getVar,
  grey,
  h1FontFamily,
  h1FontSize,
  h1FontWeight,
  h1LetterSpacing,
  h1LineHeight,
  h2FontFamily,
  h2FontSize,
  h2FontWeight,
  h2LetterSpacing,
  h2LineHeight,
  lightError,
  mediumGrey,
  outline,
  success,
  textColorSecondary,
  titleColorPrimary,
  titleColorSecondary,
  viewport7,
  viewport9,
} from '../../variables.css';
import { contentSerif } from '../../fonts.css';
import {
  authorExpandMixin,
  italicMixin,
  linkMixin,
  metaContentMixin,
  miniTextMixin,
  navButtonMixin,
  sectionWidthMixin,
} from './shared-styled-components-mixins';

export const FlexGrid = styled.div`
  display: block;
  @media (min-width: ${viewport7}) {
    display: flex;
  }
`;
export const FlexGrid9 = styled.div`
  display: block;
  @media (min-width: ${viewport9}) {
    display: flex;
  }
`;
export const Col = styled.div`
  padding: 0;
  flex: 1;
  @media (min-width: ${viewport7}) {
    padding-left: 24px;
    &:first-of-type {
      padding: 0;
    }
  }
  @media (min-width: ${viewport9}) {
    padding: 16px;
    &:first-of-type {
      padding: 16px;
    }
  }
`;
export const Col9 = styled.div`
  padding: 0;
  flex: 1;
  white-space: nowrap;
  @media (min-width: ${viewport9}) {
    padding-left: 24px;
    &:first-of-type {
      padding: 0;
    }
  }
`;
export const newPostPlaceholderText = 'Write a title and hit enter...';
export const H1Styled = styled.h1`
  ${sectionWidthMixin};
  font-family: ${getVar(h1FontFamily)}, serif;
  font-size: ${getVar(h1FontSize)};
  font-weight: ${getVar(h1FontWeight)};
  line-height: ${getVar(h1LineHeight)};
  letter-spacing: ${getVar(h1LetterSpacing)};
  margin-bottom: 24px;
  color: ${getVar(titleColorPrimary)};
  ${(p) =>
    p.shouldShowPlaceholder &&
    css`
    &::before {
      content: "${newPostPlaceholderText}";
      position: absolute;
      color: ${mediumGrey};
    }
  `};
`;
export const H2Styled = styled.h2`
  ${sectionWidthMixin};
  color: ${getVar(titleColorPrimary)};
  margin-top: 30px;
  margin-bottom: 8px;
  font-family: ${getVar(h2FontFamily)}, sans-serif;
  font-size: ${getVar(h2FontSize)};
  font-weight: ${getVar(h2FontWeight)};
  line-height: ${getVar(h2LineHeight)};
  letter-spacing: ${getVar(h2LetterSpacing)};
`;
export const H3Styled = styled.h3`
  ${sectionWidthMixin};
  color: ${getVar(titleColorSecondary)};
  text-overflow: ellipsis;
  //max-height: 56px;
  margin-bottom: 8px;
  letter-spacing: -0.47px;
  font-size: 25.2px;
  line-height: 28px;
  font-weight: 600;
  font-style: normal;
  font-family: ${getVar(h2FontFamily)}, sans-serif;
`;
export const ContentSectionStyled = styled.section`
  ${sectionWidthMixin};
  font-family: ${contentSerif}, serif;
  font-size: 21px;
  line-height: 1.58;
  letter-spacing: -0.01em;
  margin-bottom: 52px;
`;
export const CodeSectionStyled = styled(ContentSectionStyled)`
  font-family: ${getVar(codeFontFamily)}, monospace;
  font-size: 16px;
  font-weight: ${getVar(codeFontWeight)};
  max-height: 350px;
  letter-spacing: ${getVar(codeLetterSpacing)};
  word-spacing: -0.2em;
  line-height: ${getVar(codeLineHeight)};
  background: ${getVar(backgroundColorSecondary)};
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
  visibility: visible;
`;
export const A = styled.a`
  ${linkMixin}
`;
export const Code = styled.code`
  font-family: ${getVar(codeFontFamily)}, monospace;
  font-size: ${getVar(codeFontSize)};
  font-weight: ${getVar(codeFontWeight)};
  line-height: ${getVar(codeLineHeight)};
  letter-spacing: ${getVar(codeLetterSpacing)};
  color: ${getVar(textColorSecondary)};
  background: ${getVar(backgroundColorSecondary)};
  padding: 4px;
  margin: 0 2px;
`;
export const SiteInfo = styled.span`
  color: ${getVar(textColorSecondary)};
  font-family: ${getVar(altFontFamily)}, sans-serif;
  font-size: ${getVar(altFontSize)};
  font-weight: ${getVar(altFontWeight)};
  line-height: ${getVar(altLineHeight)};
  letter-spacing: ${getVar(altLetterSpacing)};
`;
export const ItalicText = styled.em`
  ${italicMixin};
`;
export const StrikeText = styled.span`
  color: ${getVar(textColorSecondary)};
  text-decoration: line-through;
  font-family: inherit;
`;
export const BoldText = styled.strong`
  color: ${getVar(textColorSecondary)};
  font-weight: 700;
`;
export const MiniText = styled.span`
  ${miniTextMixin}
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
  font-family: ${getVar(codeFontFamily)};
  line-height: 36px;
  border-radius: 2px;
  border: 1px solid ${grey};
  padding: 2px 8px;
  ${(p) =>
    p.error &&
    css`
      border-color: ${error};
    `}
`;
export const TextArea = styled.textarea`
  font-size: 18px;
  font-weight: 400;
  font-family: ${getVar(codeFontFamily)};
  line-height: 36px;
  border-radius: 2px;
  border: 1px solid ${grey};
  padding: 2px 8px;
  min-height: 200px;
  ${(p) =>
    p.error &&
    css`
      border-color: ${error};
    `}
`;
export const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-family: ${getVar(altFontFamily)};
  ${(p) =>
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
  font-family: ${getVar(codeFontFamily)};
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const Button = styled.button`
  ${navButtonMixin};
  display: block;
  width: 100%;
  margin-bottom: 16px;
  background: ${getVar(accentColorPrimary)};

  &:hover {
    background: ${getVar(accentColorSecondary)};
  }
  ${(p) =>
    p.disabled &&
    css`
      cursor: not-allowed;
      background: ${mediumGrey};
      &:hover {
        box-shadow: none;
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
export const DeleteButton = styled(Button)`
  background: ${lightError};
  &:hover {
    background: ${error};
  }
`;
export const ButtonSpan = styled.span`
  color: white;
  font-family: ${getVar(altFontFamily)};
`;

// LIL SASSY FORMS with ICONS
export const LilSassyMenu = styled.div`
  position: absolute;
  transition: 0.1s top;
  top: ${(p) => p.top}px;
  z-index: 13;
  background-image: linear-gradient(to bottom, rgba(49, 49, 47, 0.99), #262625);
  background-repeat: repeat-x;
  border-radius: 5px;
  padding: 0 10px;
  color: ${darkGrey};
`;
const blink = keyframes`
  from, to {
    background-color: ${getVar(accentColorPrimary)};
  }
  50% {
    background-color: transparent;
  }
`;
export const Cursor = styled.div`
  position: absolute;
  height: 2px;
  width: 100%;
  background-color: ${getVar(accentColorPrimary)};
  animation: 1s ${blink} step-end infinite;
}
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
  //outline: ${getVar(outline)};
`;
export const DarkInput = styled.input`
  //flex: 1;
  background: rgba(0, 0, 0, 0);
  color: #fff;
  border: none;
  //outline: ${getVar(outline)};
  font-size: 16px;
  border-radius: 5px;
  display: block;
  box-sizing: border-box;
  width: 100%;
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
export const AuthorExpand = styled(Link)`
  ${metaContentMixin};
  ${authorExpandMixin};
`;
