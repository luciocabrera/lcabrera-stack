import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skelleton } from '@/design-system/tokens/commons.stylex';
import { filterBaseStyles } from '@/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  checkbox: {
    cursor: 'pointer',
    height: '1rem',
    width: '1rem',
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
  noResults: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
  },
  option: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: {
      default: '0',
      ':hover': '0.25rem',
    },
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.surfaceSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'flex-start',
    position: 'relative', // Anchor for shimmer overlay
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionDisabled: {
    cursor: 'default',
    pointerEvents: 'none',
  },
  optionsList: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  virtualContainer: (height: string) => ({
    position: 'relative',
    height,
    overflowX: 'hidden',
    overflowY: 'auto',
  }),
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
  virtualScrollArea: (height: number) => ({
    position: 'relative',
    height,
  }),
});

export const skeletonStyles = { ...skelleton };

export const styles = {
  checkbox: localStyles.checkbox,
  container: filterBaseStyles.container,
  label: localStyles.label,
  loadingMore: localStyles.loadingMore,
  noResults: localStyles.noResults,
  option: localStyles.option,
  optionDisabled: localStyles.optionDisabled,
  optionsList: localStyles.optionsList,
  searchInput: filterBaseStyles.input,
  virtualContainer: localStyles.virtualContainer,
  virtualOffset: localStyles.virtualOffset,
  virtualScrollArea: localStyles.virtualScrollArea,
};
