import { createGlobalStyle } from 'styled-components';

export const white = '#fff';
export const abramovTextWhite = 'hsla(0,0%,100%,0.88)';
export const lightGrey = '#DEDEDF';
export const mediumGrey = '#C7C7C8';
export const grey = '#7C7C7C';
export const darkGrey = '#292929';
export const lightBlue = '#A0CFE1';
export const blue = '#79bbd5';
export const darkBlue = '#1F7596';
export const lightError = '#ff6565';
export const error = '#cc0000';
export const success = '#5CB85C';
export const viewport7 = '768px';
export const viewport9 = '992px';
export const viewport12 = '1200px';

// colors
export const backgroundColorPrimary = '--background-color-primary';
export const backgroundColorSecondary = '--background-color-secondary';
export const textColorPrimary = '--text-color-primary';
export const textColorSecondary = '--text-color-secondary';
export const titleColorPrimary = '--title-color-primary';
export const titleColorSecondary = '--title-color-secondary';
export const accentColorPrimary = '--accent-color-primary';
export const accentColorSecondary = '--accent-color-secondary';
export const accentHoverColor = '--accent-hover-color';
export const boxShadow = '--filbert-box-shadow';
export const outline = '--filbert-outline';

// typeography
export const italicFontFamily = '--italic-font-family';
// H1
export const h1FontFamily = '--h1-font-family';
export const h1FontSize = '--h1-font-size';
export const h1FontWeight = '--h1-font-weight';
export const h1LineHeight = '--h1-line-height';
export const h1LetterSpacing = '--h1-letter-spacing';
// H2
export const h2FontFamily = '--h2-font-family';
export const h2FontSize = '--h2-font-size';
export const h2FontWeight = '--h2-font-weight';
export const h2LineHeight = '--h2-line-height';
export const h2LetterSpacing = '--h2-letter-spacing';
// P (body)
export const bodyFontFamily = '--body-font-family';
export const bodyFontSize = '--body-font-size';
export const bodyFontWeight = '--body-font-weight';
export const bodyLineHeight = '--body-line-height';
export const bodyLetterSpacing = '--body-letter-spacing';
// SITEINFO
export const altFontFamily = '--alt-font-family';
export const altFontSize = '--alt-font-size';
export const altFontWeight = '--alt-font-weight';
export const altLineHeight = '--alt-line-height';
export const altLetterSpacing = '--alt-letter-spacing';
// CODE
export const codeFontFamily = '--code-font-family';
export const codeFontSize = '--code-font-size';
export const codeFontWeight = '--code-font-weight';
export const codeLineHeight = '--code-line-height';
export const codeLetterSpacing = '--code-letter-spacing';
// MINI
export const miniFontFamily = '--mini-font-family';
export const miniFontSize = '--mini-font-size';
export const miniFontWeight = '--mini-font-weight';
export const miniLineHeight = '--mini-line-height';
export const miniLetterSpacing = '--mini-letter-spacing';

export function getVar(name, fallback) {
  return `var(${name}${fallback ? `, ${fallback}` : ''})`;
}

// Medium style
export const titleSerif = 'filbert-title-serif';
export const contentSerif = 'filbert-content-serif';
export const italicSerif = 'filbert-italic-serif';
export const sansSerif = 'filbert-sans-serif';
export const monospaced = 'filbert-monospace';

// Apple style
export const titleSerifAlt = 'filbert-title-alt';
export const contentSerifAlt = 'filbert-content-alt';
export const italicSerifAlt = 'filbert-italic-alt';
export const sansSerifAlt = 'filbert-sans-alt';
export const monospacedAlt = 'filbert-monospace-alt';

export default createGlobalStyle`
body {
  // default light theme
  ${backgroundColorPrimary}: ${white};
  ${backgroundColorSecondary}: ${lightGrey};
  ${textColorPrimary}: ${darkGrey};
  ${textColorSecondary}: ${darkGrey};
  ${titleColorPrimary}: ${darkGrey};
  ${titleColorSecondary}: ${grey};
  ${accentColorPrimary}: ${blue};
  ${accentColorSecondary}: ${darkBlue};
  ${boxShadow}: ${`0 2px 4px 0 ${mediumGrey}`};
  ${outline}: ${`3px solid ${blue}`};
  // default mixed sans & serif style typography
  ${italicFontFamily}: ${italicSerif};
  ${h1FontFamily}: ${titleSerif};
  ${h1FontSize}: 46px;
  ${h1FontWeight}: 400;
  ${h1LineHeight}: 1.25;
  ${h1LetterSpacing}: normal;
  ${h2FontFamily}: ${sansSerif};
  ${h2FontSize}: 32px;
  ${h2FontWeight}: 600;
  ${h2LineHeight}: 1.22;
  ${h2LetterSpacing}: -0.012em;
  ${bodyFontFamily}: ${contentSerif};
  ${bodyFontSize}: 16px;
  ${bodyFontWeight}: 400;
  ${bodyLineHeight}: 1.5;
  ${bodyLetterSpacing}: normal;
  ${altFontFamily}: ${sansSerif};
  ${altFontSize}: 21px;
  ${altFontWeight}: 400;
  ${altLineHeight}: 1.58;
  ${altLetterSpacing}: -0.01em;
  ${codeFontFamily}: ${monospaced};
  ${codeFontSize}: 18px;
  ${codeFontWeight}: 400;
  ${codeLineHeight}: 28px;
  ${codeLetterSpacing}: -0.03em;
  ${miniFontFamily}: ${sansSerif};
  ${miniFontSize}: 16px;
  ${miniFontWeight}: 300;
  ${miniLineHeight}: 1.4;
  ${miniLetterSpacing}: 0;
}
body.dark {
  ${backgroundColorPrimary}: ${darkGrey};
  ${backgroundColorSecondary}: ${grey};
  ${textColorPrimary}: ${abramovTextWhite};
  ${textColorSecondary}: ${white};
  ${titleColorPrimary}: ${white};
  ${titleColorSecondary}: ${abramovTextWhite};
  ${accentColorPrimary}: ${darkBlue};
  ${accentColorSecondary}: ${blue};
  ${boxShadow}: ${`0 2px 4px 0 ${darkGrey}`};
  ${outline}: ${`3px solid ${blue}`};
}
body.sans {
  // sans-serif modern typography
  ${italicFontFamily}:${italicSerifAlt};
  ${h1FontFamily}: ${titleSerifAlt};
  ${h1FontSize}: 48px;
  ${h1FontWeight}: 600;
  ${h1LineHeight}: 1.1;
  ${h1LetterSpacing}: 0.003em;
  ${h2FontFamily}: ${titleSerifAlt};
  ${h2FontSize}: 34px;
  ${h2FontWeight}: 600;
  ${h2LineHeight}: 1.1;
  ${h2LetterSpacing}: 0.01em;
  ${bodyFontFamily}: ${contentSerifAlt};
  ${bodyFontSize}: 17px;
  ${bodyFontWeight}: 400;
  ${bodyLineHeight}: 1.52947;
  ${bodyLetterSpacing}: -0.021em;
  ${altFontFamily}: ${sansSerifAlt};
  ${altFontSize}: 22px;
  ${altFontWeight}: 300;
  ${altLineHeight}: 1.45455;
  ${altLetterSpacing}: 0.016em;
  ${codeFontFamily}: ${monospacedAlt};
  ${codeFontSize}: 18px;
  ${codeFontWeight}: 400;
  ${codeLineHeight}: 28px;
  ${codeLetterSpacing}: -0.027em;
  ${miniFontFamily}: ${contentSerifAlt};
  ${miniFontSize}: 14px;
  ${miniFontWeight}: 400;
  ${miniLineHeight}: 1.4;
  ${miniLetterSpacing}: -0.01em;
}
`;
