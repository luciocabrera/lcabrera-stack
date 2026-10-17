import { typography } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  cell: {
    stroke: colors.surfacePrimary,
    strokeWidth: 1,
    cursor: 'pointer',
  },
  chart: {
    overflow: 'visible',
    display: 'block',
    height: 'auto',
    maxWidth: '100%',
  },
  figure: {
    margin: 0,
    overflowX: 'auto',
  },
  hatch: {
    stroke: colors.textPrimary,
    strokeWidth: 1.5,
  },
  high: {
    fill: colors.success,
  },
  label: {
    fill: colors.textPrimary,
    fontSize: typography.fontSizeXs,
  },
  low: {
    fill: colors.error,
  },
  mid: {
    fill: colors.warning,
  },
  none: {
    fill: colors.disabled,
  },
  overlay: {
    pointerEvents: 'none',
  },
  run: {
    fill: colors.borderPrimary,
    cursor: 'pointer',
  },
});
