import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

const base = stylex.create({
  line: {
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
  },
});

const toneVariants = stylex.create({
  error: { stroke: colors.error },
  info: { stroke: colors.info },
  neutral: { stroke: colors.textSecondary },
  success: { stroke: colors.success },
  warning: { stroke: colors.warning },
});

export const styles = {
  line: base.line,
  tone: toneVariants,
};
