import { css } from 'styled-components';
import {
  getVar,
  textColorSecondary,
  textColorPrimary,
  accentColorPrimary,
  accentColorSecondary,
  blue,
  lightBlue,
  grey,
  boxShadow,
  backgroundColorPrimary,
  accentHoverColor,
  abramovTextWhite,
} from '../../variables.css';
import { italicSerif, monospaced, sansSerif } from '../fonts.css';

export const sectionWidthMixin = css`
  max-width: 740px;
  margin: 0 auto;
`;
// TODO: use ::selection to style MetaType nodes when selected
export const editSectionBorderMixin = css`
  border: 4px solid
    ${(p) => (p.isEditing ? getVar(accentColorPrimary) : 'transparent')};
  ${(p) =>
    p.isEditMode &&
    css`
      &:hover {
        cursor: pointer;
        border: 4px solid
          ${p.isEditing
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
  }
`;
export const italicMixin = css`
  font-family: ${italicSerif}, sans-serif;
  color: ${getVar(textColorSecondary)};
`;
export const miniTextMixin = css`
  font-family: ${sansSerif}, sans-serif;
  font-weight: 300;
  font-style: normal;
  font-size: 16px;
  line-height: 1.4;
  color: ${getVar(textColorSecondary)};
  letter-spacing: 0;
`;
export const navButtonMixin = css`
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
  fill: ${getVar(textColorPrimary)};
  position: relative;
  top: -1px;
  vertical-align: middle;
  height: 21px;
  width: 21px;
  border-bottom: 2px solid transparent;
  &:hover {
    fill: ${getVar(accentColorSecondary)};
  }
  ${(p) =>
    p.checked &&
    `
    fill: ${getVar(accentColorSecondary)};
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
  font-family: ${monospaced}, monospaced;
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
