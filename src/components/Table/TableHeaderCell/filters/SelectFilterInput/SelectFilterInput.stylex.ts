import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
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
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  noResults: {
    padding: spacing.sm,
    color: colors.textSecondary,
    fontSize: '0.875rem',
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
    maxHeight: '12rem',
    overflowY: 'auto',
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
    fontSize: '0.875rem',
  },
});
