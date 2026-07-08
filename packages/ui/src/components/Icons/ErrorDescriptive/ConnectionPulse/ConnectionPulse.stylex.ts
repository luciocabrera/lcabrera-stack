import * as stylex from '@stylexjs/stylex';

const pulseScale = stylex.keyframes({
  '0%': { opacity: 0.18, transform: 'scale(0.9)' },
  '50%': { opacity: 0.06, transform: 'scale(1.15)' },
  '100%': { opacity: 0.18, transform: 'scale(0.9)' },
});

export const styles = stylex.create({
  pulse: {
    fill: 'currentColor',
    fillOpacity: 0.08,
  },
  pulseCircle: {
    animationDuration: {
      default: '2.2s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: pulseScale,
    animationTimingFunction: 'ease-in-out',
    transformOrigin: '180px 110px',
  },
});
