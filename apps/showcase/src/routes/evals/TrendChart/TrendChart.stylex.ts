import { typography } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  annotation: {
    stroke: colors.info,
  },
  axis: {
    fill: colors.textTertiary,
    fontSize: typography.fontSizeXs,
  },
  band: {
    fill: colors.brandPrimaryBackground,
    stroke: 'none',
  },
  chart: {
    overflow: 'visible',
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
  },
  content: {
    stroke: colors.warning,
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
  line: {
    fill: 'none',
    stroke: colors.brandPrimary,
    strokeWidth: 1.5,
  },
  mark: {
    strokeDasharray: '4 3',
    strokeWidth: 1.5,
  },
  model: {
    stroke: colors.error,
  },
});
