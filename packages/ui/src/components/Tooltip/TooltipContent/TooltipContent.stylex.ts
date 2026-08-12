import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  tooltip,
  transitions,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  tooltip: (positionAnchor: string) => ({
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
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
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
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
  // The arrow is a square rotated 45°, half buried under the tooltip body. Only
  // the two edges that end up outside carry a border — they are what continues
  // the surface outline around the tip — so colour and style are declared once
  // here and each placement opts in the two widths it needs.
  //
  // `rotate(45deg)` turns clockwise, so the original corners end up pointing:
  // top-left → up, top-right → right, bottom-right → down, bottom-left → left.
  // The visible edges are the two meeting at whichever corner points outward.
  //
  // Those widths are deliberately PHYSICAL, not logical. The rotation is
  // physical and does not flip under RTL, so `borderInline*` would move the
  // border to the wrong edges there while the arrow kept its shape.
  //
  // The four zeros below are physical for the same reason, and that is
  // load-bearing rather than stylistic: the shorthand `borderWidth: 0` expands
  // to the LOGICAL longhands, which are different property keys, so a placement
  // setting `borderRightWidth` would not override it — both would ship and the
  // winner would come down to stylesheet order.
  arrow: {
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    backgroundColor: colors.surfaceElevated,
    position: 'absolute',
    transform: 'rotate(45deg)',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    height: tooltip.arrowSize,
    width: tooltip.arrowSize,
  },
  // Tooltip above the trigger: arrow hangs off the bottom, pointing down —
  // the bottom-right corner.
  arrowTop: {
    borderBottomWidth: '1px',
    borderRightWidth: '1px',
    bottom: tooltip.arrowOffset,
    left: '50%',
    marginLeft: tooltip.arrowOffset,
  },
  // Tooltip below the trigger: arrow on top, pointing up — the top-left corner.
  arrowBottom: {
    borderLeftWidth: '1px',
    borderTopWidth: '1px',
    left: '50%',
    marginLeft: tooltip.arrowOffset,
    top: tooltip.arrowOffset,
  },
  // Tooltip left of the trigger: arrow on the right, pointing right — the
  // top-right corner.
  arrowLeft: {
    borderRightWidth: '1px',
    borderTopWidth: '1px',
    marginTop: tooltip.arrowOffset,
    right: tooltip.arrowOffset,
    top: '50%',
  },
  // Tooltip right of the trigger: arrow on the left, pointing left — the
  // bottom-left corner.
  arrowRight: {
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
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
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
    positionArea: 'top',
    transform: `translateY(${tooltip.slideDistance})`,
    marginBottom: spacing.xs,
  },
  bottom: {
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
    positionArea: 'bottom',
    transform: `translateY(calc(-1 * ${tooltip.slideDistance}))`,
    marginTop: spacing.xs,
  },
  left: {
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
    positionArea: 'left',
    transform: `translateX(${tooltip.slideDistance})`,
    marginRight: spacing.xs,
  },
  right: {
    // eslint-disable-next-line @stylexjs/valid-styles -- CSS anchor positioning; StyleX's allowlist predates the spec (ADR-002)
    positionArea: 'right',
    transform: `translateX(calc(-1 * ${tooltip.slideDistance}))`,
    marginLeft: spacing.xs,
  },
});
