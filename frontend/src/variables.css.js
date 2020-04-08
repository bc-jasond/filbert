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

export function getVar(name, fallback) {
  return `var(${name}${fallback ? `, ${fallback}` : ''})`;
}

export default createGlobalStyle`
body {
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
`;
