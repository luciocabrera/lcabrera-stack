import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
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
  },
  title: {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 600,
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
