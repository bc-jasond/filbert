import { css } from 'styled-components';
import { blue, boxShadow, darkBlue, darkGrey, grey, lightBlue } from '../css';
import { italicSerif, monospaced, sansSerif } from '../fonts.css';

export const sectionWidthMixin = css`
  max-width: 740px;
  margin: 0 auto;
`;
export const editSectionBorderMixin = css`
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
export const linkMixin = css`
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
export const italicMixin = css`
  font-family: ${italicSerif}, sans-serif;
`;
export const miniTextMixin = css`
  font-family: ${sansSerif}, sans-serif;
  font-weight: 300;
  font-style: normal;
  font-size: 16px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.68);
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
    color: white;
    background-color: ${lightBlue};
    box-shadow: ${boxShadow};
  }
  ${p =>
    p.isOpen &&
    `
    color: white;
    background-color: ${lightBlue};
  `}
`;
export const svgIconMixin = css`
  fill: #fff;
  position: relative;
  top: -1px;
  vertical-align: middle;
  height: 21px;
  width: 21px;
  border-bottom: 2px solid transparent;
  &:hover {
    fill: ${blue};
  }
  ${p =>
    p.checked &&
    `
    fill: ${darkBlue};
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
  color: ${grey};
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
    color: ${darkGrey};
    cursor: pointer;
  }
`;
