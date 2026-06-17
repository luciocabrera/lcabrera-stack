import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skeleton } from '@/design-system/tokens/commons.stylex';
import { filterBaseStyles } from '@/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  checkbox: {
    cursor: 'pointer',
    height: spacing.md,
    width: spacing.md,
  },
  label: {
    flex: '1', // Take remaining space after checkbox
    overflow: 'hidden',
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: typography.fontSizeSm,
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0, // Allow shrinking below content size
  },
  loadingMore: {
    padding: spacing.sm,
    backgroundColor: colors.surfacePrimary,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    position: 'sticky',
    textAlign: 'center',
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    bottom: '0',
  },
  option: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: {
      default: '0',
      ':hover': borderRadius.sm,
    },
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':nth-child(even)': colors.surfaceStripe,
      ':hover': colors.surfaceSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    position: 'relative', // Anchor for shimmer overlay
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionButtonReset: {
    appearance: 'none',
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    fontFamily: 'inherit',
    fontSize: 'inherit',
    margin: 0,
    outline: 'none',
    textAlign: 'left',
    width: '100%',
  },
  optionDisabled: {
    cursor: 'default',
    pointerEvents: 'none',
  },
  containerFill: {
    flex: '1',
    minHeight: 0,
  },
  listFilterButton: {
    borderRadius: 0,
  },
  listFilterButtonActive: {
    borderColor: colors.borderFocus,
    borderRadius: 0,
  },
});

export const skeletonStyles = { ...skeleton };

export const styles = {
  checkbox: localStyles.checkbox,
  container: filterBaseStyles.container,
  containerFill: localStyles.containerFill,
  label: localStyles.label,
  listFilterButton: localStyles.listFilterButton,
  listFilterButtonActive: localStyles.listFilterButtonActive,
  loadingMore: localStyles.loadingMore,
  option: localStyles.option,
  optionButtonReset: localStyles.optionButtonReset,
  optionDisabled: localStyles.optionDisabled,
};
