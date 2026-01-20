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
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: typography.fontSizeSm,
  },
  noResults: {
    padding: spacing.sm,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    textAlign: 'center',
  },
  option: {
    padding: spacing.xs,
    borderRadius: {
      default: '0',
      ':hover': '0.25rem',
    },
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.surfaceSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
  },
  optionsList: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minHeight: '10rem',
    maxHeight: '10rem',
    overflow: 'hidden',
  },
  searchInput: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: {
      default: 'revert',
      ':focus': 'none',
    },
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
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
  virtualContainer: (height: number) => ({
    position: 'relative',
    height,
    overflowY: 'auto',
  }),
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
  virtualSpacer: (height: number) => ({
    height,
  }),
});
