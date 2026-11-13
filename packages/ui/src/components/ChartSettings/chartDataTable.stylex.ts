import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const chartDataTableStyles = stylex.create({
  cell: {
    paddingBlock: spacing.xxs,
    paddingInline: spacing.xs,
    textAlign: 'start',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  table: {
    borderCollapse: 'collapse',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    marginTop: spacing.sm,
  },
});
