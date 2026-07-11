import * as stylex from '@stylexjs/stylex';

const drift = stylex.keyframes({
  '0%': { opacity: 0.35, transform: 'translateY(0)' },
  '50%': { opacity: 0.85, transform: 'translateY(-8px)' },
  '100%': { opacity: 0.35, transform: 'translateY(0)' },
});

export const styles = stylex.create({
  driftGroup: {
    animationDuration: {
      default: '2.6s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: drift,
    animationTimingFunction: 'ease-in-out',
  },
});
