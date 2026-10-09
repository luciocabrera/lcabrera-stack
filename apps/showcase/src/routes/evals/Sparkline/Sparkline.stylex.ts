import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  chart: {
    overflow: 'visible',
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
  },
  dot: {
    fill: colors.brandPrimary,
    stroke: colors.surfacePrimary,
    strokeWidth: 1,
    cursor: 'pointer',
  },
  figure: {
    margin: 0,
  },
  error: {
    fill: colors.error,
  },
  line: {
    fill: 'none',
    stroke: colors.borderPrimary,
    strokeWidth: 1.5,
  },
  neutral: {
    fill: colors.textTertiary,
  },
  success: {
    fill: colors.success,
  },
});
