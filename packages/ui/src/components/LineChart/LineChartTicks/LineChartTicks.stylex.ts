import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartTicksStyles = stylex.create({
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightTight,
    position: 'absolute',
    whiteSpace: 'nowrap',
  },
  x: {
    gridArea: 'xticks',
    position: 'relative',
    height: `calc(${typography.fontSizeXs} * 2)`,
  },
  xAt: (offset: string) => ({
    transform: `translateX(-${offset})`,
    left: offset,
    top: spacing.xxs,
  }),
  y: {
    gridArea: 'yticks',
    position: 'relative',
  },
  yAt: (offset: string) => ({
    transform: 'translateY(-50%)',
    right: spacing.xs,
    top: offset,
  }),
});
