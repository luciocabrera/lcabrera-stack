import * as stylex from "@stylexjs/stylex";

import { borderRadius, spacing, typography } from "@/design-system/tokens/base.stylex";
import { colors } from "@/design-system/tokens/colors.stylex";
import { skeleton } from "@/design-system/tokens/commons.stylex";
import { filterBaseStyles } from "@/design-system/tokens/filters.stylex";

const localStyles = stylex.create({
  checkbox: {
    cursor: "pointer",
    height: spacing.md,
    width: spacing.md,
  },
  label: {
    flex: "1", // Take remaining space after checkbox
    overflow: "hidden",
    color: colors.textPrimary,
    cursor: "pointer",
    fontSize: typography.fontSizeSm,
    textAlign: "left",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0, // Allow shrinking below content size
  },
  loadingMore: {
    padding: spacing.sm,
    backgroundColor: colors.surfacePrimary,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    position: "sticky",
    textAlign: "center",
    borderTopColor: colors.borderPrimary,
    borderTopStyle: "solid",
    borderTopWidth: "1px",
    bottom: "0",
  },
  noResults: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    height: "100%",
  },
  option: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: {
      default: "0",
      ":hover": borderRadius.sm,
    },
    gap: spacing.sm,
    overflow: "hidden",
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":nth-child(even)": colors.surfaceStripe,
      ":hover": colors.surfaceSecondary,
    },
    cursor: "pointer",
    display: "flex",
    justifyContent: "flex-start",
    position: "relative", // Anchor for shimmer overlay
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionDisabled: {
    cursor: "default",
    pointerEvents: "none",
  },
  optionsList: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: "solid",
    borderWidth: "1px",
    gap: spacing.xs,
    overflow: "hidden",
    backgroundColor: colors.surfacePrimary,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  optionsListFill: {
    flex: "1",
    overflow: "hidden",
    minHeight: 0,
  },
  containerFill: {
    flex: "1",
    minHeight: 0,
  },
  virtualContainer: (height: string) => ({
    position: "relative",
    height,
    overflowX: "hidden",
    overflowY: "auto",
  }),
  virtualContainerFill: {
    flex: "1",
    position: "relative",
    overflowX: "hidden",
    overflowY: "auto",
  },
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
  virtualScrollArea: (height: number) => ({
    position: "relative",
    height,
  }),
  clearButton: {
    position: "absolute",
    transform: "translateY(-50%)",
    right: spacing.xs,
    top: "50%",
  },
  listFilterButton: {
    borderRadius: 0,
  },
  listFilterButtonActive: {
    borderColor: colors.borderFocus,
    borderRadius: 0,
  },
  searchInputWithClear: {
    paddingRight: spacing.xl,
  },
});

export const skeletonStyles = { ...skeleton };

export const styles = {
  checkbox: localStyles.checkbox,
  clearButton: localStyles.clearButton,
  container: filterBaseStyles.container,
  containerFill: localStyles.containerFill,
  label: localStyles.label,
  listFilterButton: localStyles.listFilterButton,
  listFilterButtonActive: localStyles.listFilterButtonActive,
  loadingMore: localStyles.loadingMore,
  noResults: localStyles.noResults,
  option: localStyles.option,
  optionDisabled: localStyles.optionDisabled,
  optionsList: localStyles.optionsList,
  optionsListFill: localStyles.optionsListFill,
  searchInput: filterBaseStyles.input,
  searchInputWithClear: localStyles.searchInputWithClear,
  searchInputWrapper: filterBaseStyles.inputWrapper,
  virtualContainer: localStyles.virtualContainer,
  virtualContainerFill: localStyles.virtualContainerFill,
  virtualOffset: localStyles.virtualOffset,
  virtualScrollArea: localStyles.virtualScrollArea,
};
