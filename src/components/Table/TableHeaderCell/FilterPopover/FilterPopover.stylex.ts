import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  popover: (minHeight?: string) => ({
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
    // display: 'flex',
    // flexDirection: 'column',
    // flexWrap: 'wrap',
    // Hide initially to prevent flash at 0,0 before positioning
    opacity: 0,
    // Fixed positioning for manual placement via JavaScript
    position: 'fixed',
    minHeight: minHeight ?? 'auto',
    minWidth: '24rem',
    width: '24rem',
  }),
  content: {
    // flex: '1',
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
    flex: '1',
    overflow: 'hidden',
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
});
