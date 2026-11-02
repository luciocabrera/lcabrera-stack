import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartLegendStyles = stylex.create({
  dashed: {
    borderTopStyle: 'dashed',
  },
  item: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'inline-flex',
  },
  list: {
    gridArea: 'legend',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    color: colors.textSecondary,
    columnGap: spacing.md,
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: typography.fontSizeXs,
    rowGap: spacing.xxs,
    marginTop: spacing.xs,
  },
  swatch: {
    display: 'inline-block',
    borderTopStyle: 'solid',
    borderTopWidth: 2,
    width: spacing.md,
  },
});
