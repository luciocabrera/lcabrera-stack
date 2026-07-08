import * as stylex from '@stylexjs/stylex';

const shake = stylex.keyframes({
  '0%': { transform: 'translateX(0)' },
  '20%': { transform: 'translateX(-3px)' },
  '40%': { transform: 'translateX(3px)' },
  '60%': { transform: 'translateX(-2px)' },
  '80%': { transform: 'translateX(2px)' },
  '100%': { transform: 'translateX(0)' },
});

export const styles = stylex.create({
  crack: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeOpacity: 0.95,
    strokeWidth: 3.5,
  },
  link: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeOpacity: 0.9,
    strokeWidth: 3.5,
  },
  linkGroup: {
    animationDuration: {
      default: '1.6s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: shake,
    animationTimingFunction: 'ease-in-out',
    transformOrigin: '180px 110px',
  },
});
