import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const heatmapLegendStyles = stylex.create({
  ramp: {
    borderRadius: borderRadius.sm,
    backgroundImage: `linear-gradient(to right, ${colors.backgroundTertiary}, ${colors.info})`,
    display: 'inline-block',
    height: spacing.sm,
    width: spacing.xxl,
  },
});
