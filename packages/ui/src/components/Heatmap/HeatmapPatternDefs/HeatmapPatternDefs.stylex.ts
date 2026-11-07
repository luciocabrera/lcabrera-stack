import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const heatmapPatternStyles = stylex.create({
  dot: {
    fill: colors.textPrimary,
  },
  hatch: {
    stroke: colors.textPrimary,
    strokeWidth: 1.5,
  },
});
