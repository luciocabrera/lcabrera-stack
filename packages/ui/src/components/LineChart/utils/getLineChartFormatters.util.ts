import type { LineChartProps } from '#ui/components/LineChart/LineChart.types';

import { formatChartValue } from './formatChartValue.util';

type GetLineChartFormattersArgs = Pick<LineChartProps, 'xAxis' | 'yAxis'>;

export const getLineChartFormatters = ({
  xAxis,
  yAxis,
}: GetLineChartFormattersArgs) => ({
  x: xAxis?.format ?? formatChartValue,
  y: yAxis?.format ?? formatChartValue,
});
