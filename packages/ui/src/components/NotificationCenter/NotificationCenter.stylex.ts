import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  stack: {
    gap: spacing.sm,
    display: 'flex',
  },
  stackBottom: {
    flexDirection: 'column-reverse',
  },
  stackTop: {
    flexDirection: 'column',
  },
  viewport: {
    inset: 'auto',
    margin: 0,
    padding: 0,
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 2000,
  },
  viewportBottomLeft: {
    bottom: spacing.md,
    left: spacing.md,
  },
  viewportBottomRight: {
    bottom: spacing.md,
    right: spacing.md,
  },
  viewportTopLeft: {
    left: spacing.md,
    top: spacing.md,
  },
  viewportTopRight: {
    right: spacing.md,
    top: spacing.md,
  },
});
