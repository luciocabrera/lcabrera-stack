/* oxlint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @stylexjs/valid-styles */
import {
  borderRadius,
  easing,
  shadows,
  spacing,
  tooltip,
  transitions,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  tooltip: (positionAnchor: string) => ({
    positionAnchor,
    inset: 'unset',
    margin: 0,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'visible',
    paddingBlock: spacing.sm,
    paddingInline: spacing.sm,
    transition: `opacity ${transitions.fast} ${easing.easeInOut}, transform ${transitions.fast} ${easing.easeInOut}`,
    backdropFilter: 'blur(8px)',
    backgroundColor: colors.surfaceElevated,
    boxShadow: shadows.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeXs,
    justifySelf: 'anchor-center',
    lineHeight: typography.lineHeightTight,
    opacity: 0,
    pointerEvents: 'none',
    whiteSpace: 'pre-line',
    wordWrap: 'break-word',
    maxWidth: '16rem',
  }),
  tooltipVisible: {
    opacity: 1,
    transform: 'translate(0, 0)',
  },
  arrow: {
    backgroundColor: colors.surfaceElevated,
    position: 'absolute',
    transform: 'rotate(45deg)',
    height: tooltip.arrowSize,
    width: tooltip.arrowSize,
  },
  arrowTop: {
    bottom: tooltip.arrowOffset,
    left: '50%',
    marginLeft: tooltip.arrowOffset,
  },
  arrowBottom: {
    left: '50%',
    marginLeft: tooltip.arrowOffset,
    top: tooltip.arrowOffset,
  },
  arrowLeft: {
    marginTop: tooltip.arrowOffset,
    right: tooltip.arrowOffset,
    top: '50%',
  },
  arrowRight: {
    left: tooltip.arrowOffset,
    marginTop: tooltip.arrowOffset,
    top: '50%',
  },
  arrowPositionHorizontal: (offset: number) => ({
    left: `${offset}px`,
    marginLeft: 0,
  }),
  arrowPositionVertical: (offset: number) => ({
    marginTop: 0,
    top: `${offset}px`,
  }),
  top: {
    positionArea: 'top',
    transform: `translateY(${tooltip.slideDistance})`,
    marginBottom: spacing.xs,
  },
  bottom: {
    positionArea: 'bottom',
    transform: `translateY(calc(-1 * ${tooltip.slideDistance}))`,
    marginTop: spacing.xs,
  },
  left: {
    positionArea: 'left',
    transform: `translateX(${tooltip.slideDistance})`,
    marginRight: spacing.xs,
  },
  right: {
    positionArea: 'right',
    transform: `translateX(calc(-1 * ${tooltip.slideDistance}))`,
    marginLeft: spacing.xs,
  },
});
