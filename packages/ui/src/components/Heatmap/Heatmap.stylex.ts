import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const heatmapLayout = stylex.create({
  root: {
    margin: 0,
    gridTemplateAreas: '". columns" "rows plot" "legend legend"',
    columnGap: spacing.xs,
    display: 'grid',
    gridTemplateColumns: 'max-content max-content',
    position: 'relative',
    rowGap: spacing.xs,
    maxWidth: '100%',
    overflowX: 'auto',
    width: 'fit-content',
  },
});

export const heatmapFill = stylex.create({
  empty: {
    fill: 'transparent',
    stroke: colors.borderPrimary,
    strokeDasharray: '2 2',
    strokeWidth: 1,
  },
  sequential: (percent: string) => ({
    fill: `color-mix(in srgb, ${colors.info} ${percent}, ${colors.backgroundTertiary})`,
  }),
});
