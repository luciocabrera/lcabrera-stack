import * as stylex from '@stylexjs/stylex';

/**
 * Pulse animation keyframes for overlay loading effect
 */
const pulseAnimation = stylex.keyframes({
  from: { opacity: 0.6 },
  to: { opacity: 0.75 },
});

/**
 * TableOverlay styles - semi-transparent pulsing overlay
 */
export const tableOverlayStyles = stylex.create({
  overlay: {
    inset: 0,
    borderRadius: 'inherit',
    animationDirection: 'alternate',
    animationDuration: '0.75s',
    animationIterationCount: 'infinite',
    animationName: pulseAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundColor: 'var(--overlay-bg, rgba(0, 0, 0, 0.5))',
    pointerEvents: 'all',
    position: 'absolute',
    zIndex: 10,
  },
  wrapper: {
    display: 'contents',
  },
});
