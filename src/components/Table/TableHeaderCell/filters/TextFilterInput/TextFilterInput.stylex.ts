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
      ':focus': colors.borderFocus,
      ':focus-visible': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow: 'none !important',
    outline: 'none !important',
    outlineOffset: '0 !important',
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    transition: 'border-color 0.15s ease',
  },
});
