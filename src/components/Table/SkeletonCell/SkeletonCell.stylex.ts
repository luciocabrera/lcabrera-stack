import * as stylex from '@stylexjs/stylex';

/**
 * Pulse animation keyframes for skeleton loading effect
 */
const pulseAnimation = stylex.keyframes({
  from: { opacity: 0.4 },
  to: { opacity: 0.7 },
});

/**
 * SkeletonCell styles with pulse animation
 */
export const skeletonCellStyles = stylex.create({
  base: {
    borderRadius: '4px',
    animationDirection: 'alternate',
    animationDuration: '0.75s',
    animationIterationCount: 'infinite',
    animationName: pulseAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundColor: 'var(--skeleton-bg, rgba(128, 128, 128, 0.15))',
    height: '16px',
  },
  /** Width variants based on data type */
  widthBoolean: {
    width: '24px',
  },
  widthCurrency: {
    width: '80%',
  },
  widthDate: {
    width: '70%',
  },
  widthNumber: {
    width: '50%',
  },
  widthString: {
    width: '90%',
  },
});
