import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: colors.textPrimary,
  },
  radio: {
    cursor: 'pointer',
    height: '1rem',
    width: '1rem',
  },
  radioGroup: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
  },
  radioOption: {
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
});
