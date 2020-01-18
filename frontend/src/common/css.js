export const lightGrey = 'rgba(0,0,0,.05)';
export const mediumGrey = 'rgba(0,0,0,.24)';
export const grey = 'rgba(0,0,0,.54)';
export const darkGrey = 'rgba(0,0,0,.84)'; // #292929
export const lightBlue = '#A0CFE1';
export const blue = '#79bbd5';
export const darkBlue = '#52a8c9';
export const error = '#cc0000';
export const success = '#5CB85C';

export const bezier = (property = 'all') =>
  `transition: ${property} 0.3s cubic-bezier(0.175, 0.885, 0.320, 1.275);`;
export const ease = (property = 'all') =>
  `transition: ${property} 0.125s ease-out`;
export const boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.25);';
export const outline = '3px solid #67A1F9';
