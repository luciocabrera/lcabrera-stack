import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  spacing,
  transitions,
  typography,
} from './base.stylex';
import { colors } from './colors.stylex';

const shimmerAnimation = stylex.keyframes({
  '0%': { transform: 'translateX(-100%)' },
  '100%': { transform: 'translateX(100%)' },
});

/**
 * Common reusable styles shared across components
 */

// Base interactive element (button/link) styles
export const baseInteractiveStyles = stylex.create({
  element: {
    borderColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: '1px', // Always 1px for consistent sizing across all variants
    gap: spacing.xs,
    outline: {
      ':focus-visible': `2px solid ${colors.borderFocus}`,
    },
    overflow: 'hidden',
    textDecoration: 'none',
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    alignItems: 'center',
    appearance: 'none',
    boxSizing: 'border-box',
    containerType: 'inline-size',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    justifyContent: 'center',
    opacity: {
      default: 1,
      ':hover': 0.85,
    },
    outlineOffset: {
      ':focus-visible': '2px',
    },
    position: 'relative',
    userSelect: 'none',
    width: '100%',
  },

  label: {
    flex: '1 1 auto',
    overflow: 'hidden',
    display: {
      default: 'block',
      '@container (max-width: 60px)': 'none',
    },
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  icon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
});

// Base ripple effect
export const rippleBase = stylex.create({
  ripple: {
    backgroundPosition: 'center',
    transition: {
      default: 'background-size 0.8s, background-image 0.8s',
      ':active': 'background-size 0s, background-image 0s',
    },
    backgroundSize: {
      default: '0%',
      ':hover': '15000%',
      ':active': '100%',
    },
  },
});

export const widthVariants = stylex.create({
  auto: {
    width: 'auto',
  },

  full: {
    width: '100%',
  },
});

// Ripple variants for each color
export const colorVariants = stylex.create({
  'danger-ghost': {
    borderColor: 'transparent',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.error,
    },
    backgroundImage: 'none',
    color: {
      default: colors.textSecondary,
      ':hover': colors.errorText,
    },
  },

  error: {
    borderColor: colors.error,
    backgroundColor: colors.error,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.errorText,
  },

  ghost: {
    borderColor: 'transparent',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    color: colors.textPrimary,
  },

  outline: {
    borderColor: colors.borderPrimary,
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    color: colors.textPrimary,
  },

  primary: {
    borderColor: colors.borderPrimary,
    backgroundColor: colors.brandSecondary,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, ${colors.hover} 1%, transparent 1%)`,
    },
    color: colors.brandSecondaryText,
  },

  secondary: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandSecondary,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.brandSecondaryText,
  },

  success: {
    borderColor: colors.success,
    backgroundColor: colors.success,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.successText,
  },

  warning: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
    backgroundImage: {
      default: 'none',
      ':hover': `radial-gradient(circle, oklch(0% 0 0 / 0.1) 1%, transparent 1%)`,
    },
    color: colors.warningText,
  },
});

export const overlayStyles = stylex.create({
  overlay: {
    inset: 0,
    backgroundColor: colors.backgroundPrimary, //    '#050814',
    // backgroundImage:
    //   'linear-gradient(45deg, rgba(90, 144, 255, 0.95), transparent, #00000078, #14224575, #21183896,rgba(40, 228, 194, 0.86),rgba(196, 120, 255, 0.84), rgba(126, 158, 255, 0.64))',
    // backgroundSize: 'cover',
    // backgroundImage:
    //   'linear-gradient(90deg, rgba(90, 144, 255, 0.95), rgba(40, 228, 194, 0.86), rgba(196, 120, 255, 0.84), rgba(126, 158, 255, 0.64))',

    //  radial-gradient(44% 44% at 82% 24%, rgba(40, 228, 194, 0.86), transparent 71%),
    //   radial-gradient(52% 56% at 84% 82%, rgba(196, 120, 255, 0.84), transparent 73%),
    //   radial-gradient(40% 40% at 53% 62%, rgba(126, 158, 255, 0.64), transparent 74%)',
    //filter: 'blur(72px) saturate(150%) brightness(0.5)',
    // 'linear-gradient(90deg, rgba(90, 144, 255, 0.95), rgba(40, 228, 194, 0.86), rgba(196, 120, 255, 0.84), rgba(126, 158, 255, 0.64))',
    //#0000, #00000078,#14224575, #28e4c144,, #7e9eff70
    //#5a91ff57, #21183896,   #c478ff4d)

    backgroundImage: 'linear-gradient(90deg,#213c71a8, #21183896, #6e00c3b0)',
    mixBlendMode: 'screen',
    opacity: 0.5,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: -10,
    height: '100%',
    width: '100%',
  },
  overlayParent: {
    backgroundColor: 'transparent',
    isolation: 'isolate',
    // justifyContent: 'center',
    // position: 'relative',
  },
});

// Shared size variants for buttons and links
export const sizeVariants = stylex.create({
  embedded: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xxs,
    alignItems: 'center',
    fontSize: typography.fontSizeXs,
    justifyContent: 'center',
    height: spacing.lg,
    minHeight: spacing.lg,
    minWidth: spacing.lg,
    width: spacing.lg,
  },

  lg: {
    borderRadius: borderRadius.lg,
    paddingBlock: spacing.md,
    paddingInline: spacing.lg,
    fontSize: typography.fontSizeLg,
    height: spacing.xxl,
    minHeight: spacing.xxl,
  },

  md: {
    borderRadius: borderRadius.md,
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    fontSize: typography.fontSizeMd,
    height: '2.5rem',
    minHeight: '2.5rem',
  },

  sm: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    fontSize: typography.fontSizeSm,
    height: spacing.xl,
    minHeight: spacing.xl,
  },

  mini: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xs,
    paddingInline: spacing.xs,
    alignItems: 'center',
    fontSize: typography.fontSizeSm,
    justifyContent: 'center',
    height: '1.75rem',
    minHeight: '1.75rem',
    minWidth: '1.75rem',
    width: '1.75rem',
  },
});

// Orientation variants for buttons and links in toolbars/navs
export const orientationVariants = stylex.create({
  horizontal: {
    justifyContent: 'center',
  },

  vertical: {
    justifyContent: 'flex-start',
  },
});

export const skeleton = stylex.create({
  /** Loading overlay container for shimmer effect (absolute, covers parent) */
  loadingOverlay: {
    borderRadius: borderRadius.sm,
    insetBlock: spacing.xxs,
    insetInline: 0,
    overflow: 'hidden',
    backgroundColor: `${colors.hover}80`,
    position: 'absolute',
    zIndex: 1,
  },
  /** Inline skeleton bar placeholder (flow-based, for skeleton-only rows) */
  placeholderBar: {
    borderRadius: borderRadius.sm,
    flex: '1',
    overflow: 'hidden',
    backgroundColor: `${colors.hover}80`,
    pointerEvents: 'none',
    position: 'relative',
    height: `calc(2rem - ${spacing.xxs} * 2)`,
  },
  /** Shimmer wave that moves across the overlay */
  shimmerWave: {
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: shimmerAnimation,
    animationTimingFunction: 'ease-in-out',
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${colors.surfacePrimary} 50%, transparent 100%)`,
    display: 'block',
    pointerEvents: 'none',
    height: '100%',
    width: '100%',
  },
});
