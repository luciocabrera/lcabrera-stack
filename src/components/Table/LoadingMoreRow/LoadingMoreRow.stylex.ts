import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';

const shimmerKeyframes = stylex.keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(100%)' },
});

export const styles = stylex.create({
  cell: {
    padding: '16px',
    textAlign: 'center',
  },
  container: {
    gap: '8px',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  count: {
    fontSize: typography.fontSizeSm,
  },
  row: {
    borderTopColor: 'var(--color-border-subtle)',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  shimmer: {
    borderRadius: '4px',
    overflow: 'hidden',
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: shimmerKeyframes,
    animationTimingFunction: 'ease-in-out',
    backgroundColor: 'var(--color-bg-subtle)',
    position: 'relative',
    height: '4px',
    width: '200px',
  },
  shimmerOverlay: {
    backgroundColor: 'var(--color-bg-hover)',
    opacity: 0.5,
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  text: {
    fontSize: typography.fontSizeSm,
  },
});
