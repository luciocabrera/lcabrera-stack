/* eslint-disable @typescript-eslint/naming-convention */
import * as stylex from "@stylexjs/stylex";

import { borderRadius, easing, spacing, transitions, typography } from "./base.stylex.ts";
import { colors } from "./colors.stylex.ts";

const shimmerAnimation = stylex.keyframes({
  "0%": { transform: "translateX(-100%)" },
  "100%": { transform: "translateX(100%)" },
});

/**
 * Common reusable styles shared across components
 */

// Base interactive element (button/link) styles
export const baseInteractiveStyles = stylex.create({
  element: {
    borderColor: "transparent",
    borderStyle: "solid",
    borderWidth: "1px", // Always 1px for consistent sizing across all variants
    gap: spacing.xs,
    outline: {
      ":focus-visible": `2px solid ${colors.borderFocus}`,
    },
    overflow: "hidden",
    textDecoration: "none",
    transition: `opacity ${transitions.fast} ${easing.easeInOut}`,
    alignItems: "center",
    appearance: "none",
    boxSizing: "border-box",
    containerType: "inline-size",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: typography.fontFamily,
    fontWeight: typography.fontWeightMedium,
    justifyContent: "center",
    opacity: {
      default: 1,
      ":hover": 0.85,
    },
    outlineOffset: {
      ":focus-visible": "2px",
    },
    position: "relative",
    userSelect: "none",
    width: "100%",
  },

  label: {
    flex: "1 1 auto",
    overflow: "hidden",
    display: {
      default: "block",
      "@container (max-width: 60px)": "none",
    },
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  icon: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    justifyContent: "center",
    height: 20,
    width: 20,
  },
});

// Base ripple effect
export const rippleBase = stylex.create({
  ripple: {
    backgroundPosition: "center",
    transition: {
      default: "background-size 0.8s, background-image 0.8s",
      ":active": "background-size 0s, background-image 0s",
    },
    backgroundSize: {
      default: "0%",
      ":hover": "15000%",
      ":active": "100%",
    },
  },
});

export const widthVariants = stylex.create({
  auto: {
    width: "auto",
  },

  full: {
    width: "100%",
  },
});

// Ripple variants for each color
export const colorVariants = stylex.create({
  "danger-ghost": {
    borderColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": colors.error,
    },
    backgroundImage: "none",
    color: {
      default: colors.textSecondary,
      ":hover": colors.errorText,
    },
  },

  error: {
    borderColor: colors.error,
    backgroundColor: colors.error,
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.errorText,
  },

  ghost: {
    borderColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": colors.hover,
    },
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    color: colors.textPrimary,
  },

  outline: {
    borderColor: colors.borderPrimary,
    backgroundColor: {
      default: "transparent",
      ":hover": colors.hover,
    },
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, transparent 1%, ${colors.hover} 1%)`,
    },
    color: colors.textPrimary,
  },

  primary: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.brandPrimaryText,
  },

  secondary: {
    borderColor: colors.brandSecondary,
    backgroundColor: colors.brandSecondary,
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.brandSecondaryText,
  },

  success: {
    borderColor: colors.success,
    backgroundColor: colors.success,
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, oklch(100% 0 0 / 0.2) 1%, transparent 1%)`,
    },
    color: colors.successText,
  },

  warning: {
    borderColor: colors.warning,
    backgroundColor: colors.warning,
    backgroundImage: {
      default: "none",
      ":hover": `radial-gradient(circle, oklch(0% 0 0 / 0.1) 1%, transparent 1%)`,
    },
    color: colors.warningText,
  },
});

// Shared size variants for buttons and links
export const sizeVariants = stylex.create({
  embedded: {
    borderRadius: borderRadius.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xxs,
    alignItems: "center",
    fontSize: typography.fontSizeXs,
    justifyContent: "center",
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
    height: "2.5rem",
    minHeight: "2.5rem",
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
    alignItems: "center",
    fontSize: typography.fontSizeSm,
    justifyContent: "center",
    height: "1.75rem",
    minHeight: "1.75rem",
    minWidth: "1.75rem",
    width: "1.75rem",
  },
});

// Orientation variants for buttons and links in toolbars/navs
export const orientationVariants = stylex.create({
  horizontal: {
    justifyContent: "center",
  },

  vertical: {
    justifyContent: "flex-start",
  },
});

export const skeleton = stylex.create({
  /** Loading overlay container for shimmer effect (absolute, covers parent) */
  loadingOverlay: {
    borderRadius: borderRadius.sm,
    insetBlock: spacing.xxs,
    insetInline: 0,
    overflow: "hidden",
    backgroundColor: colors.hover,
    position: "absolute",
    zIndex: 1,
  },
  /** Inline skeleton bar placeholder (flow-based, for skeleton-only rows) */
  placeholderBar: {
    borderRadius: borderRadius.sm,
    flex: "1",
    overflow: "hidden",
    backgroundColor: colors.hover,
    pointerEvents: "none",
    position: "relative",
    height: `calc(2rem - ${spacing.xxs} * 2)`,
  },
  /** Shimmer wave that moves across the overlay */
  shimmerWave: {
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationName: shimmerAnimation,
    animationTimingFunction: "ease-in-out",
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${colors.surfacePrimary} 50%, transparent 100%)`,
    height: "100%",
    width: "100%",
  },
});
