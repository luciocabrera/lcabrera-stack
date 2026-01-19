import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  popover: {
    inset: 'auto',
    margin: 0,
    padding: 0,
    borderColor: colors.borderPrimary,
    borderRadius: '0.5rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    transition: 'opacity 0.15s ease',
    backgroundColor: colors.surfacePrimary,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    // Hide initially to prevent flash at 0,0 before positioning
    opacity: 0,
    // Fixed positioning for manual placement via JavaScript
    position: 'fixed',
    minWidth: '20rem',
    width: '24rem',
  },
  content: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: spacing.md,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
  },
  closeButton: {
    padding: spacing.xxs,
    borderRadius: '0.25rem',
    borderWidth: '0',
    transition: 'background-color 0.15s ease',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.surfaceSecondary,
    },
    color: {
      default: colors.textSecondary,
      ':hover': colors.textPrimary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
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
  loadingContainer: {
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    lineHeight: typography.lineHeightNormal,
    textAlign: 'center',
  },
  divider: {
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  dividerText: {
    padding: `0 ${spacing.sm}`,
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightMedium,
    textTransform: 'uppercase',
  },
  stringFilterContainer: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});
