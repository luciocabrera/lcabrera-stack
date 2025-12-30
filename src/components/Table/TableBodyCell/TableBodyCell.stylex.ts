/* eslint-disable @typescript-eslint/naming-convention */
import * as stylex from '@stylexjs/stylex';

import { borderRadius, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

/**
 * Shimmer animation for skeleton loading effect
 */
const shimmerAnimation = stylex.keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
});
// const pulseAnimation = stylex.keyframes({
//   '0%': { opacity: 0.4 },
//   '25%': { opacity: 0.6 },
//   '50%': { opacity: 0.8 },
//   '75%': { opacity: 0.6 },
//   '100%': { opacity: 0.4 },
// });
export const tableBodyCellStyles = stylex.create({
  alignCenter: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  base: (minWidth?: number | string, width?: number | string) => ({
    flex: '1 1 0%',
    paddingBlock: 'var(--table-padding-block)',
    paddingInline: 'var(--table-padding-inline)',
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    position: 'relative',
    minWidth: minWidth ?? null,
    width: width ?? null,
  }),
  checkbox: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    display: 'flex',
    justifyContent: 'center',
    height: 16,
    width: 16,
  },
  checkboxChecked: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
    color: colors.brandPrimaryText,
  },
  /** Text content with ellipsis overflow */
  textContent: {
    overflow: 'hidden',
    display: 'block',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  /** Loading overlay container for shimmer effect */
  loadingOverlay: {
    inset: 0,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.hover,
    pointerEvents: 'none',
    position: 'absolute',

    // animationDuration: '1.2s',
    // animationIterationCount: 'infinite',
    // animationName: pulseAnimation,
    // animationTimingFunction: 'ease-in-out',
    // backgroundColor: 'rgba(120, 120, 120, 0.25)',
  },
  /** Shimmer wave that moves across the overlay */
  shimmerWave: {
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: shimmerAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${colors.surfacePrimary} 50%, transparent 100%)`,
    height: '100%',
    width: '100%',
  },
});
