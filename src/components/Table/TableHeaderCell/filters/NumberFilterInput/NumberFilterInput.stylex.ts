import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.borderFocus,
      ':focus': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    flex: '1',
    outline: 'none !important',
    transition: 'border-color 0.15s ease',
    backgroundColor: colors.surfacePrimary,
    boxShadow: 'none !important',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    outlineOffset: '0px',
    minWidth: 0,
  },
  inputGroup: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
  separator: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
});
