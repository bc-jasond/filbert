import { css } from 'styled-components';
import {
  abramovTextWhite,
  accentColorPrimary,
  accentColorSecondary,
  boxShadow,
  codeFontFamily,
  getVar,
  grey,
  miniFontFamily,
  miniFontSize,
  miniFontWeight,
  miniLetterSpacing,
  miniLineHeight,
  textColorPrimary,
  textColorSecondary,
  white,
} from '../../variables.css';
import { italicSerif, sansSerif } from '../../fonts.css';

export const sectionWidthMixin = css`
  max-width: 740px;
  margin: 0 auto;
`;
// TODO: use ::selection to style MetaType nodes when selected
export const editSectionBorderMixin = css`
  border: 4px solid
    ${({ isEditing }) =>
      isEditing ? getVar(accentColorPrimary) : 'transparent'};
  ${({ isEditMode, isEditing }) =>
    isEditMode &&
    css`
      &:hover {
        cursor: pointer;
        border: 4px solid
          ${isEditing
            ? getVar(accentColorPrimary)
            : getVar(accentColorSecondary)};
      }
    `}
`;
export const linkMixin = css`
  color: ${getVar(accentColorSecondary)};
  cursor: pointer;
  font: inherit;
  text-decoration: none;
  background-repeat: repeat-x;
  background-image: linear-gradient(
    to right,
    currentColor 100%,
    currentColor 0
  );
  background-size: 1px 1px;
  background-position: 0 calc(1em + 1px);
  &:hover {
    color: ${getVar(accentColorPrimary)};
    background-image: linear-gradient(
      to right,
      currentColor 100%,
      currentColor 0
    );
  }
  &:visited {
    color: mediumpurple;
  }
`;
export const italicMixin = css`
  font-family: ${italicSerif}, sans-serif;
  color: ${getVar(textColorSecondary)};
`;
export const miniTextMixin = css`
  font-family: ${getVar(miniFontFamily)}, sans-serif;
  font-weight: ${getVar(miniFontWeight)};
  font-style: normal;
  font-size: ${getVar(miniFontSize)};
  line-height: ${getVar(miniLineHeight)};
  color: ${getVar(textColorSecondary)};
  letter-spacing: ${getVar(miniLetterSpacing)};
`;
export const navButtonMixin = css`
  font-family: ${getVar(codeFontFamily)}, monospaced;
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
    color: ${abramovTextWhite};
    background-color: ${getVar(accentColorPrimary)};
    box-shadow: ${getVar(boxShadow)};
  }
  ${(p) =>
    p.isOpen &&
    `
    color: ${abramovTextWhite};
    background-color: ${getVar(accentColorPrimary)};
  `}
`;
export const svgIconMixin = css`
  fill: ${white};
  position: relative;
  top: -1px;
  vertical-align: middle;
  height: 21px;
  width: 21px;
  border-bottom: 2px solid transparent;
  &:hover {
    fill: ${getVar(accentColorPrimary)};
  }
  ${(p) =>
    p.checked &&
    `
    fill: ${getVar(accentColorPrimary)};
  `}
`;
export const metaFontMixin = css`
  letter-spacing: 0px;
  font-size: 16px;
  line-height: 18px;
  font-style: normal;
`;
export const metaContentMixin = css`
  ${metaFontMixin};
  color: ${getVar(textColorPrimary)};
  font-family: ${sansSerif};
`;
export const authorExpandMixin = css`
  position: absolute;
  font-family: ${getVar(codeFontFamily)}, monospaced;
  color: ${grey};
  cursor: pointer;
  text-decoration: none;
  transition: letter-spacing 0.125s, color 0.125s;
  &:hover {
    letter-spacing: 8px;
    color: ${getVar(textColorSecondary)};
    cursor: pointer;
  }
`;
