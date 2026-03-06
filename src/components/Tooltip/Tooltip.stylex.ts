import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  trigger: {
    display: 'inline-flex',
  },
  tooltip: {
    border: 'none',
    inset: 'unset',
    margin: 0,
    padding: `${spacing.xxs} ${spacing.xs}`,
    borderRadius: borderRadius.sm,
    transition: `opacity ${transitions.fast} ${easing.easeInOut}, transform ${transitions.fast} ${easing.easeInOut}, overlay ${transitions.fast} ${easing.easeInOut} allow-discrete, display ${transitions.fast} ${easing.easeInOut} allow-discrete`,
    backgroundColor: colors.surfaceElevated,
    boxShadow: shadows.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightTight,
    opacity: {
      default: 1,
      ':popover-open': 1,
    },
    pointerEvents: 'none',
    position: 'fixed',
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
    zIndex: zIndex.tooltip,
    maxWidth: '16rem',
  },
  // Placement offsets — applied via anchor positioning fallback
  top: {
    marginBottom: spacing.xxs,
  },
  bottom: {
    marginTop: spacing.xxs,
  },
  left: {
    marginRight: spacing.xxs,
  },
  right: {
    marginLeft: spacing.xxs,
  },
});
