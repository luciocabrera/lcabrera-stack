import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { skeleton } from '#ui/design-system/tokens/commons.stylex';
import { filterBaseStyles } from '#ui/design-system/tokens/filters.stylex';

import { ITEM_HEIGHT } from './VirtualList.constants';

const localStyles = stylex.create({
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
    borderRadius: {
      default: '0',
      ':hover': borderRadius.sm,
    },
    gap: spacing.sm,
    overflow: 'hidden',
    paddingBlock: 0,
    paddingInline: spacing.sm,
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':nth-child(even)': colors.surfaceStripe,
      ':hover': colors.surfaceSecondary,
    },
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'flex-start',
    position: 'relative', // Anchor for shimmer overlay
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionHeight: (height: number) => ({
    height,
  }),
  optionButtonReset: {
    margin: 0,
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    outline: 'none',
    appearance: 'none',
    fontFamily: 'inherit',
    fontSize: 'inherit',
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
  containerShrinkable: {
    minHeight: 0,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
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
  container: filterBaseStyles.container,
  containerFill: localStyles.containerFill,
  containerShrinkable: localStyles.containerShrinkable,
  group: localStyles.group,
  label: localStyles.label,
  listFilterButton: localStyles.listFilterButton,
  listFilterButtonActive: localStyles.listFilterButtonActive,
  loadingMore: localStyles.loadingMore,
  option: [localStyles.option, localStyles.optionHeight(ITEM_HEIGHT)],
  optionButtonReset: localStyles.optionButtonReset,
  optionDisabled: localStyles.optionDisabled,
};
