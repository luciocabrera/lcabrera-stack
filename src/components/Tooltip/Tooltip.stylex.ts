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
    inset: 'unset',
    margin: 0,
    borderColor: 'transparent',
    borderRadius: borderRadius.sm,
    borderStyle: 'none',
    borderWidth: 0,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    transition: `opacity ${transitions.fast} ${easing.easeInOut}, transform ${transitions.fast} ${easing.easeInOut}`,
    backdropFilter: 'blur(8px)',
    backgroundColor: colors.surfaceElevated,
    boxShadow: shadows.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightTight,
    opacity: 0,
    pointerEvents: 'none',
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
    zIndex: zIndex.tooltip,
    maxWidth: '16rem',
  },
  top: {
    transform: 'translateY(4px)',
    marginBottom: spacing.xxs,
  },
  bottom: {
    transform: 'translateY(-4px)',
    marginTop: spacing.xxs,
  },
  left: {
    transform: 'translateX(4px)',
    marginRight: spacing.xxs,
  },
  right: {
    transform: 'translateX(-4px)',
    marginLeft: spacing.xxs,
  },
});
