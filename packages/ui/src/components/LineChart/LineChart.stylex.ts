import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const lineChartLayout = stylex.create({
  axisLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
  },
  plot: (height: number) => ({
    gridArea: 'plot',
    position: 'relative',
    height,
    width: '100%',
  }),
  svg: {
    overflow: 'visible',
    display: 'block',
    height: '100%',
    width: '100%',
  },
  root: {
    gridTemplateAreas:
      '"ylabel ylabel" ". markers" "yticks plot" ". xticks" ". xlabel" "legend legend"',
    display: 'grid',
    gridTemplateColumns: `${spacing.xxl} minmax(0, 1fr)`,
    position: 'relative',
    width: '100%',
  },
  xLabel: {
    gridArea: 'xlabel',
    textAlign: 'center',
    paddingTop: spacing.xxs,
  },
  yLabel: {
    gridArea: 'ylabel',
    paddingBottom: spacing.xxs,
  },
});

export const lineChartStroke = stylex.create({
  error: { stroke: colors.error },
  info: { stroke: colors.info },
  neutral: { stroke: colors.textSecondary },
  secondary: { stroke: colors.brandSecondary },
  success: { stroke: colors.success },
  warning: { stroke: colors.warning },
});

export const lineChartFill = stylex.create({
  error: { fill: colors.error },
  info: { fill: colors.info },
  neutral: { fill: colors.textSecondary },
  secondary: { fill: colors.brandSecondary },
  success: { fill: colors.success },
  warning: { fill: colors.warning },
});

export const lineChartBackground = stylex.create({
  error: { backgroundColor: colors.error },
  info: { backgroundColor: colors.info },
  neutral: { backgroundColor: colors.textSecondary },
  secondary: { backgroundColor: colors.brandSecondary },
  success: { backgroundColor: colors.success },
  warning: { backgroundColor: colors.warning },
});

export const lineChartSwatch = stylex.create({
  error: { borderTopColor: colors.error },
  info: { borderTopColor: colors.info },
  neutral: { borderTopColor: colors.textSecondary },
  secondary: { borderTopColor: colors.brandSecondary },
  success: { borderTopColor: colors.success },
  warning: { borderTopColor: colors.warning },
});
