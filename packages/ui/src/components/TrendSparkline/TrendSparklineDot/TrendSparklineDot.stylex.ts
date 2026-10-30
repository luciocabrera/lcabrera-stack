import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

const base = stylex.create({
  dot: {
    stroke: colors.surfacePrimary,
    strokeWidth: 1,
  },
});

const toneVariants = stylex.create({
  error: { fill: colors.error },
  info: { fill: colors.info },
  neutral: { fill: colors.textSecondary },
  success: { fill: colors.success },
  warning: { fill: colors.warning },
});

export const styles = {
  dot: base.dot,
  tone: toneVariants,
};
