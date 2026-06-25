import * as stylex from '@stylexjs/stylex';

const shake = stylex.keyframes({
  '0%': { transform: 'translateX(0)' },
  '20%': { transform: 'translateX(-3px)' },
  '40%': { transform: 'translateX(3px)' },
  '60%': { transform: 'translateX(-2px)' },
  '80%': { transform: 'translateX(2px)' },
  '100%': { transform: 'translateX(0)' },
});

const pulseScale = stylex.keyframes({
  '0%': { opacity: 0.18, transform: 'scale(0.9)' },
  '50%': { opacity: 0.06, transform: 'scale(1.15)' },
  '100%': { opacity: 0.18, transform: 'scale(0.9)' },
});

const badgeBounce = stylex.keyframes({
  '0%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-6px)' },
  '100%': { transform: 'translateY(0)' },
});

export const styles = stylex.create({
  container: {
    gap: 12,
    alignItems: 'center',
    boxSizing: 'border-box' as const,
    // Let parent control color; default to a neutral muted tone if not set
    color: 'var(--error-illustration-color, currentColor)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    // Prevent SVG from overflowing small containers
    maxWidth: '100%',
  },
  svg: {
    display: 'block',
    height: 'auto',
    // Make sure SVG scales down nicely
    maxWidth: '560px',
    width: '100%',
  },
  message: {
    padding: '0 8px',
    color: 'currentColor',
    fontSize: '14px',
    lineHeight: 1.3,
    opacity: 0.9,
    textAlign: 'center' as const,
    maxWidth: '36ch',
  },
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
  crack: {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeOpacity: 0.95,
    strokeWidth: 3.5,
  },
  laptopDetail: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.4,
  },
  laptopFill: {
    fill: 'currentColor',
    fillOpacity: 0.1,
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.8,
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
  serverDetail: {
    fill: 'none',
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.4,
  },
  serverFill: {
    fill: 'currentColor',
    fillOpacity: 0.1,
    stroke: 'currentColor',
    strokeOpacity: 0.9,
    strokeWidth: 1.8,
  },
});
