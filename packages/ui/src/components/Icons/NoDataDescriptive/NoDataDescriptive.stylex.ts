import * as stylex from '@stylexjs/stylex';

const float = stylex.keyframes({
  '0%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
  '100%': { transform: 'translateY(0)' },
});

const drift = stylex.keyframes({
  '0%': { opacity: 0.35, transform: 'translateY(0)' },
  '50%': { opacity: 0.85, transform: 'translateY(-8px)' },
  '100%': { opacity: 0.35, transform: 'translateY(0)' },
});

const pulseScale = stylex.keyframes({
  '0%': { opacity: 0.16, transform: 'scale(0.9)' },
  '50%': { opacity: 0.05, transform: 'scale(1.15)' },
  '100%': { opacity: 0.16, transform: 'scale(0.9)' },
});

export const styles = stylex.create({
  dashedBody: {
    fill: 'none',
    stroke: 'currentColor',
    strokeDasharray: '6 7',
    strokeLinecap: 'round',
    strokeOpacity: 0.4,
    strokeWidth: 1.6,
  },
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
  handle: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeOpacity: 0.9,
    strokeWidth: 5,
  },
  headerCell: {
    fill: 'currentColor',
    fillOpacity: 0.22,
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
  pulse: {
    fill: 'currentColor',
    fillOpacity: 0.08,
  },
  pulseCircle: {
    animationDuration: {
      default: '2.4s',
      '@media (prefers-reduced-motion: reduce)': '0.01ms',
    },
    animationIterationCount: {
      default: 'infinite',
      '@media (prefers-reduced-motion: reduce)': 1,
    },
    animationName: pulseScale,
    animationTimingFunction: 'ease-in-out',
    transformOrigin: '180px 112px',
  },
  sheetDetail: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.5,
    strokeWidth: 1.4,
  },
  sheetFill: {
    fill: 'currentColor',
    fillOpacity: 0.06,
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.8,
  },
  svg: {
    display: 'block',
    height: 'auto',
    maxWidth: '520px',
    width: '100%',
  },
});
