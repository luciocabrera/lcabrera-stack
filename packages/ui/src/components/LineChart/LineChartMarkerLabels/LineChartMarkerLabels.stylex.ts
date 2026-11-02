import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartMarkerLabelsStyles = stylex.create({
  item: (offset: string) => ({
    position: 'absolute',
    transform: `translateX(-${offset})`,
    whiteSpace: 'nowrap',
    left: offset,
    top: 0,
  }),
  link: {
    color: colors.brandPrimaryText,
  },
  list: {
    gridArea: 'markers',
    margin: 0,
    padding: 0,
    listStyle: 'none',
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    position: 'relative',
    height: `calc(${typography.fontSizeXs} * 2)`,
    marginBottom: spacing.xxs,
  },
});
