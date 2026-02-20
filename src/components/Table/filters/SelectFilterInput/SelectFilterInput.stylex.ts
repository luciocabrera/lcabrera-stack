import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  checkbox: {
    cursor: 'pointer',
    height: '1rem',
    width: '1rem',
  },
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
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
    minWidth: 0, // Allow flex children to shrink below content size
  },
  optionsList: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  searchInput: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.borderFocus,
      ':focus': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: 'none !important',
    transition: 'border-color 0.15s ease',
    backgroundColor: colors.surfacePrimary,
    boxShadow: 'none !important',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
     
    outlineOffset: null,
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
  virtualContainer: (height: string) => ({
    position: 'relative',
    height,
    overflowX: 'hidden',
    overflowY: 'auto',
  }),
  virtualScrollArea: (height: number) => ({
    position: 'relative',
    height,
  }),
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
});
