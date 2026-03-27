import * as stylex from "@stylexjs/stylex";

import { spacing, typography, zIndex } from "@/design-system/tokens/base.stylex";
import { colors } from "@/design-system/tokens/colors.stylex";
import { skeleton } from "@/design-system/tokens/commons.stylex";

export const tableHeaderCellStyles = stylex.create({
  base: (minWidth?: number | string, width?: number | string) => ({
    borderColor: "red",
    borderStyle: "solid",
    paddingInline: "6px", // 'var(--table-padding-inline)',
    alignItems: "center",
    color: colors.textSecondary,
    display: "flex",
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    justifyContent: "flex-start",
    position: "sticky",
    zIndex: zIndex.sticky,
    borderRightColor: colors.borderSecondary,
    borderRightStyle: "solid",
    borderRightWidth: 1,
    height: "100%",
    maxHeight: "100%",
    maxWidth: width ?? null,
    minWidth: minWidth ?? width ?? null,
    top: 0,
    width: width ?? null,
  }),
  pinnedLeft: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    zIndex: `calc(${zIndex.sticky} + 2)`,
    left: offset,
  }),
  pinnedRight: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    zIndex: `calc(${zIndex.sticky} + 2)`,
    right: offset,
  }),
  pinnedShadowLeft: {
    boxShadow: "4px 0 8px -2px rgba(0, 0, 0, 0.12)",
    borderRightColor: colors.borderPrimary,
    borderRightWidth: 2,
  },
  pinnedShadowRight: {
    boxShadow: "-4px 0 8px -2px rgba(0, 0, 0, 0.12)",
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: "solid",
    borderLeftWidth: 2,
  },
  content: {
    flex: "1",
    overflow: "hidden",
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-start",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  controls: {
    gap: spacing.xxs,
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
  },
  settingsButton: {
    padding: 0,
  },
  resizeHandle: {
    alignItems: "center",
    cursor: "col-resize",
    display: "flex",
    justifyContent: "center",
    position: "absolute",
    touchAction: "none",
    userSelect: "none",
    zIndex: zIndex.sticky + 1,
    bottom: 0,
    right: 0,
    top: 0,
    width: 8,
  },
  resizeHandleLine: {
    transition: "background-color 0.15s ease",
    backgroundColor: {
      default: "transparent",
      ":hover": colors.borderPrimary,
    },
    height: "100%",
    width: 1,
  },
  resizeHandleActive: {
    backgroundColor: colors.borderPrimary,
  },
});

export const skeletonStyles = { ...skeleton };
