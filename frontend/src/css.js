export const bezier = (property = 'all') =>
  `transition: ${property} 0.3s cubic-bezier(0.175, 0.885, 0.320, 1.275);`;
export const ease = (property = 'all') =>
  `transition: ${property} 0.125s ease-out`;
