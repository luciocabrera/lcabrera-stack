import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  popover: {
    margin: 0,
    padding: 0,
    borderColor: colors.borderPrimary,
    borderRadius: '0.5rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: colors.surfacePrimary,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    maxWidth: '24rem',
    minWidth: '20rem',
  },
  content: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: spacing.md,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xxs,
    borderWidth: '0',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.25rem',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: colors.surfaceSecondary,
      color: colors.textPrimary,
    },
  },
  body: {
    padding: `0 ${spacing.md}`,
  },
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
    display: 'flex',
    justifyContent: 'flex-end',
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
