import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  fieldset: {
    margin: 0,
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    minInlineSize: 0,
  },
  legend: {
    padding: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.fontWeightMedium,
    marginBottom: spacing.sm,
  },
});
