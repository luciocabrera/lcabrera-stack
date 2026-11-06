import * as stylex from '@stylexjs/stylex';

import { lineChartLayout } from '#ui/components/LineChart/LineChart.stylex';

import type { LineChartAxisLabelProps } from './LineChartAxisLabel.types';

export const LineChartAxisLabel = ({
  axis,
  label,
}: LineChartAxisLabelProps) => {
  if (label === undefined) return;

  return (
    <span
      {...stylex.props(
        lineChartLayout.axisLabel,
        axis === 'x' ? lineChartLayout.xLabel : lineChartLayout.yLabel,
      )}
    >
      {label}
    </span>
  );
};
