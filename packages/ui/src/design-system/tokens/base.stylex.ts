import * as stylex from '@stylexjs/stylex';

export const spacing = stylex.defineVars({
  lg: '1.5rem', // 24px
  md: '1rem', // 16px
  sm: '0.75rem', // 12px
  xl: '2rem', // 32px
  xs: '0.5rem', // 8px
  xxl: '3rem', // 48px
  xxs: '0.25rem', // 4px
  xxxl: '4rem', // 64px
});

export const typography = stylex.defineVars({
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"Fira Code", "Courier New", monospace',

  fontSize2xl: '1.5rem', // 24px
  fontSize3xl: '2rem', // 32px
  fontSizeLg: '1.125rem', // 18px
  fontSizeMd: '1rem', // 16px
  fontSizeSm: '0.875rem', // 14px
  fontSizeXl: '1.25rem', // 20px
  fontSizeXs: '0.75rem', // 12px

  fontWeightBold: '700',
  fontWeightMedium: '500',
  fontWeightNormal: '400',
  fontWeightSemibold: '600',

  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.75',
  lineHeightTight: '1.25',
});

export const borderRadius = stylex.defineVars({
  full: '9999px',
  lg: '0.75rem', // 12px
  md: '0.5rem', // 8px
  none: '0',
  sm: '0.25rem', // 4px
  xl: '1rem', // 16px
});

export const shadows = stylex.defineVars({
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
});

export const zIndex = stylex.defineVars({
  base: '0',
  dropdown: '1000',
  modal: '1300',
  popover: '1400',
  sticky: '1100',
  tooltip: '1500',
});

export const transitions = stylex.defineVars({
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
});

export const easing = stylex.defineVars({
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  linear: 'linear',
});

export const tooltip = stylex.defineVars({
  arrowOffset: '-6px',
  arrowSize: '12px',
  slideDistance: '4px',
});
