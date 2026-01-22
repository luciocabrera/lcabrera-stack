import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
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
    cursor: 'pointer',
    fontSize: typography.fontSizeSm,
  },
  stringFilterContainer: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});
