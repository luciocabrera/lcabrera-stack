import * as stylex from '@stylexjs/stylex';

const float = stylex.keyframes({
  '0%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
  '100%': { transform: 'translateY(0)' },
});

export const styles = stylex.create({
  emptyHint: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.5,
    strokeWidth: 1.4,
  },
  handle: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeOpacity: 0.9,
    strokeWidth: 5,
  },
  lensFill: {
    fill: 'currentColor',
    fillOpacity: 0.06,
  },
  lensStroke: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 3,
  },
  magnifierGroup: {
    animationDuration: {
      default: '3s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: float,
    animationTimingFunction: 'ease-in-out',
  },
});
