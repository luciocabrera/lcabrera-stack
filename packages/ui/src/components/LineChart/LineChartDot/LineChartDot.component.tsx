import * as stylex from '@stylexjs/stylex';

import { lineChartStroke } from '#ui/components/LineChart/LineChart.stylex';

import type { LineChartDotProps } from './LineChartDot.types';

import { lineChartDotStyles } from './LineChartDot.stylex';

export const LineChartDot = ({ d, label, tone }: LineChartDotProps) => (
  <path d={d} {...stylex.props(lineChartDotStyles.dot, lineChartStroke[tone])}>
    <title>{label}</title>
  </path>
);
