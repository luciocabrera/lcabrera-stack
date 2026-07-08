import * as stylex from '@stylexjs/stylex';

const badgeBounce = stylex.keyframes({
  '0%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
  '100%': { transform: 'translateY(0)' },
});

export const styles = stylex.create({
  badge: {
    fill: 'currentColor',
  },
  badgeGroup: {
    animationDuration: {
      default: '2s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: badgeBounce,
    animationTimingFunction: 'ease-in-out',
    transformOrigin: '240px 70px',
  },
});
